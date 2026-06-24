// =============================================================================
// Section-Aware Site Crawler for www.thss.tsinghua.edu.cn
// =============================================================================
// Verified against live site structure (June 2026).
//
// URL patterns:
//   List pages:    /xydt/xwdt.htm (page 1), /xydt/xwdt/65.htm (page 2), ...
//   Articles:      /info/{column_id}/{article_id}.htm
//   Static pages:  /xygk/xyjj.htm, /xygk/xrld.htm, etc.
//
// CSS selectors:
//   Article links: a.up-article-card[href]
//   Pagination:    #page-list .p_next a[href]  (next page)
//   Total count:   #page-list .p_t             (e.g. "共655条")
//   Article title: .up-title, .arti_title, h1
//   Article date:  text matching "发布于 YYYY-MM-DD" or .arti_update
//   Article body:  .v_news_content, .wp_articlecontent
// =============================================================================
// Usage: npm run crawl
// =============================================================================

import "dotenv/config";
import "reflect-metadata";
import * as cheerio from "cheerio";
import { DataSource } from "typeorm";
import { Article } from "../src/entities/article.entity";
import { Chunk } from "../src/entities/chunk.entity";

const USER_AGENT = "TKE-RAG-Challenge-Bot/1.0 AlanYiu contact:corgiking2020@gmail.com";
const CRAWL_DELAY = parseInt(process.env.CRAWL_DELAY_MS ?? "1000", 10);
const BASE_URL = "https://www.thss.tsinghua.edu.cn";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// --- Database Connection ---
const dataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [Article, Chunk],
  synchronize: false,
  logging: false,
});

// =============================================================================
// Section Definitions (verified from homepage navigation)
// =============================================================================

interface SiteSection {
  name: string;
  listUrl: string;
  /** "list" = paginated article list, "static" = single content page */
  type: "list" | "static";
}

const SECTIONS: SiteSection[] = [
  // --- Paginated article list sections ---
  { name: "新闻动态", listUrl: `${BASE_URL}/xydt/xwdt.htm`, type: "list" },
  { name: "学生动态", listUrl: `${BASE_URL}/xydt/xsdt.htm`, type: "list" },
  { name: "校友风采", listUrl: `${BASE_URL}/xydt/xyfc.htm`, type: "list" },
  { name: "学院公告", listUrl: `${BASE_URL}/xydt/xygg.htm`, type: "list" },
  { name: "科研成果", listUrl: `${BASE_URL}/qyhz/kycg.htm`, type: "list" },
  { name: "招聘信息", listUrl: `${BASE_URL}/zszp/zpxx.htm`, type: "list" },

  // --- Static content pages ---
  { name: "学院简介", listUrl: `${BASE_URL}/xygk/xyjj.htm`, type: "static" },
  { name: "院士寄语", listUrl: `${BASE_URL}/xygk/ysjy.htm`, type: "static" },
  { name: "现任领导", listUrl: `${BASE_URL}/xygk/xrld.htm`, type: "static" },
  { name: "历史沿革", listUrl: `${BASE_URL}/xygk/lsyg.htm`, type: "static" },
  { name: "教学概述", listUrl: `${BASE_URL}/jwjx/jxgs.htm`, type: "static" },
  { name: "本科生教学", listUrl: `${BASE_URL}/jwjx/bksjx.htm`, type: "static" },
  { name: "研究生教学", listUrl: `${BASE_URL}/jwjx/yjsjx.htm`, type: "static" },
  { name: "学科方向", listUrl: `${BASE_URL}/qyhz/xkfx.htm`, type: "static" },
  { name: "支撑平台", listUrl: `${BASE_URL}/qyhz/zcpt.htm`, type: "static" },
  { name: "学生概况", listUrl: `${BASE_URL}/xsgz/xsgk.htm`, type: "static" },
  { name: "教师名录", listUrl: `${BASE_URL}/szdw/jsml.htm`, type: "static" },
];

// =============================================================================
// HTTP Fetcher
// =============================================================================

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
    });
    if (!res.ok) {
      console.error(`  HTTP ${res.status} for ${url}`);
      return null;
    }
    return await res.text();
  } catch (error) {
    console.error(`  Fetch error for ${url}:`, error);
    return null;
  }
}

// =============================================================================
// List Page Crawler (paginated sections)
// =============================================================================

/**
 * Extract article URLs from a single list page.
 * Articles use <a class="up-article-card" href="../info/1023/2687.htm">
 */
function extractArticleUrls(html: string, pageUrl: string): string[] {
  const $ = cheerio.load(html);
  const urls: string[] = [];

  $("a.up-article-card[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (href && !href.startsWith("javascript")) {
      const fullUrl = new URL(href, pageUrl).toString();
      urls.push(fullUrl);
    }
  });

  // Also check for notice-item links (学院公告 uses this)
  $("a.notice-item[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (href && !href.startsWith("javascript")) {
      const fullUrl = new URL(href, pageUrl).toString();
      urls.push(fullUrl);
    }
  });

  return urls;
}

/**
 * Extract the next page URL from pagination.
 * Pagination: <span class="p_next p_fun"><a href="xwdt/65.htm">下页</a></span>
 */
function extractNextPageUrl(html: string, pageUrl: string): string | null {
  const $ = cheerio.load(html);
  const nextLink = $(".p_next a").attr("href");
  if (nextLink && !nextLink.startsWith("javascript")) {
    return new URL(nextLink, pageUrl).toString();
  }
  return null;
}

/**
 * Crawl all pages of a paginated section, collecting article URLs.
 */
async function crawlListSection(section: SiteSection): Promise<string[]> {
  const allUrls: string[] = [];
  let currentUrl: string | null = section.listUrl;
  let pageNum = 1;

  while (currentUrl) {
    console.log(`  Page ${pageNum}: ${currentUrl}`);
    const html = await fetchPage(currentUrl);
    if (!html) break;

    const urls = extractArticleUrls(html, currentUrl);
    allUrls.push(...urls);
    console.log(`    Found ${urls.length} articles on this page`);

    await sleep(CRAWL_DELAY);

    // Get next page
    const nextUrl = extractNextPageUrl(html, currentUrl);
    if (nextUrl && nextUrl !== currentUrl) {
      currentUrl = nextUrl;
      pageNum++;
    } else {
      currentUrl = null;
    }

    // Safety limit
    if (pageNum > 100) {
      console.warn("  [warn] Hit page limit (100), stopping pagination");
      break;
    }
  }

  return [...new Set(allUrls)]; // deduplicate
}

// =============================================================================
// Article Parser
// =============================================================================

interface ParsedArticle {
  url: string;
  title: string;
  section: string;
  publishedDate: Date | null;
  summary: string | null;
  body: string;
  imageUrls: string[];
}

/**
 * Parse an individual article page.
 */
async function parseArticle(url: string, section: string): Promise<ParsedArticle | null> {
  const html = await fetchPage(url);
  if (!html) return null;

  const $ = cheerio.load(html);

  // Remove noise
  $(
    "script, style, nav, footer, .header, .up-navbar, .up-footer, .up-share, .up-breadcrumb, .side-mask, .sidebar, iframe",
  ).remove();

  // Extract title
  const title =
    $(".up-title").first().text().trim() ||
    $(".arti_title").first().text().trim() ||
    $("h1").first().text().trim() ||
    $("title")
      .text()
      .replace(/-清华大学软件学院$/, "")
      .trim() ||
    "Untitled";

  // Extract date — look for "发布于 2026-06-15" pattern or date elements
  let publishedDate: Date | null = null;
  const dateText = $(".arti_update").first().text().trim() || $(".date-time").first().text().trim();

  if (dateText) {
    const dateMatch = dateText.match(/\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/);
    if (dateMatch) {
      publishedDate = new Date(dateMatch[0].replace(/[/.]/g, "-"));
    }
  }

  // Also check page text for "发布于" pattern
  if (!publishedDate) {
    const pageText = $.text();
    const pubMatch = pageText.match(/发布于\s*(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})/);
    if (pubMatch) {
      publishedDate = new Date(pubMatch[1].replace(/[/.]/g, "-"));
    }
  }

  // Extract body content
  const bodyEl = $(".v_news_content, .wp_articlecontent, .arti_con, #content_div, .page").first();

  let body = "";
  if (bodyEl.length) {
    // Replace <br> with newlines
    bodyEl.find("br").replaceWith("\n");
    // Get text from paragraphs and block elements
    bodyEl.find("p, div.summary, h2, h3, h4, li").each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 5) {
        body += text + "\n\n";
      }
    });
    // Fallback: get raw text if no paragraphs found
    if (!body.trim()) {
      body = bodyEl.text().trim();
    }
  }

  // Final fallback for static pages
  if (!body.trim()) {
    body = $(".page, .content, main, article").first().text().trim();
  }

  // Clean up body
  body = body
    .replace(/\n{3,}/g, "\n\n") // collapse excess newlines
    .replace(/\s{2,}/g, " ") // collapse excess spaces within lines
    .trim();

  // Extract image URLs from article body
  const imageUrls: string[] = [];
  $(".v_news_content img, .wp_articlecontent img, .arti_con img, #vsb_content img, .page img").each(
    (_, el) => {
      const src = $(el).attr("src");
      if (src && !src.includes("spacer.gif") && !src.includes("blank.gif")) {
        try {
          const absoluteUrl = new URL(src, url).toString();
          if (!imageUrls.includes(absoluteUrl)) {
            imageUrls.push(absoluteUrl);
          }
        } catch {
          // skip malformed URLs
        }
      }
    },
  );

  if (!body || body.length < 20) {
    console.warn(`  [warn] No/short body for: ${url} (${body.length} chars)`);
    return null;
  }

  return {
    url,
    title,
    section,
    publishedDate,
    summary: body.slice(0, 200).trim(),
    body,
    imageUrls,
  };
}

/**
 * Parse a static content page (like 学院简介, 现任领导).
 */
async function parseStaticPage(url: string, section: string): Promise<ParsedArticle | null> {
  return parseArticle(url, section);
}

// =============================================================================
// Save Article to Database
// =============================================================================

async function saveArticle(
  articleRepo: ReturnType<typeof dataSource.getRepository<Article>>,
  data: ParsedArticle,
): Promise<boolean> {
  // Skip if already in DB
  const existing = await articleRepo.findOne({ where: { url: data.url } });
  if (existing) {
    // Update image_urls if missing
    if (!existing.imageUrls || existing.imageUrls.length === 0) {
      if (data.imageUrls.length > 0) {
        existing.imageUrls = data.imageUrls;
        await articleRepo.save(existing);
        console.log(`  [updated images] ${data.title} (${data.imageUrls.length} images)`);
        return true;
      }
    }
    console.log(`  [skip] Already crawled: ${data.title}`);
    return false;
  }

  const article = articleRepo.create({
    url: data.url,
    title: data.title,
    section: data.section,
    publishedDate: data.publishedDate,
    summary: data.summary,
    body: data.body,
    imageUrls: data.imageUrls,
  });
  await articleRepo.save(article);
  const imgCount = data.imageUrls.length > 0 ? `, ${data.imageUrls.length} imgs` : "";
  console.log(`  [saved] ${data.title} (${data.body.length} chars${imgCount})`);
  return true;
}

// =============================================================================
// Main Crawl Loop
// =============================================================================

async function main() {
  console.log("Initializing database connection...");
  await dataSource.initialize();
  const articleRepo = dataSource.getRepository(Article);

  console.log("Starting section-aware crawl...\n");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Crawl delay: ${CRAWL_DELAY}ms\n`);

  let totalSaved = 0;
  let totalSkipped = 0;

  for (const section of SECTIONS) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Section: ${section.name} (${section.type})`);
    console.log(`URL: ${section.listUrl}`);
    console.log("=".repeat(60));

    if (section.type === "static") {
      // Static page: parse directly
      const article = await parseStaticPage(section.listUrl, section.name);
      if (article) {
        const saved = await saveArticle(articleRepo, article);
        if (saved) totalSaved++;
        else totalSkipped++;
      }
      await sleep(CRAWL_DELAY);
      continue;
    }

    // Paginated list section
    const articleUrls = await crawlListSection(section);
    console.log(`\n  Total unique URLs: ${articleUrls.length}`);

    for (let i = 0; i < articleUrls.length; i++) {
      const url = articleUrls[i];
      console.log(`  [${i + 1}/${articleUrls.length}] ${url}`);

      const article = await parseArticle(url, section.name);
      if (article) {
        const saved = await saveArticle(articleRepo, article);
        if (saved) totalSaved++;
        else totalSkipped++;
      }

      await sleep(CRAWL_DELAY);
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Crawl complete.`);
  console.log(`  Articles saved:   ${totalSaved}`);
  console.log(`  Articles skipped: ${totalSkipped}`);
  console.log("=".repeat(60));

  await dataSource.destroy();
}

main().catch((err) => {
  console.error("Crawl failed:", err);
  process.exit(1);
});
