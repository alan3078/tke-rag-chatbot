/**
 * run-eval.ts
 *
 * Runs each evaluation question through the chat API and checks correctness
 * using the hint field. Results are written to a JSON file.
 * No database required — reads from evaluation-questions.json, writes to eval-results.json.
 *
 * Usage:
 *   npx tsx apps/backend/scripts/run-eval.ts [--limit N] [--category CAT] [--start N]
 *
 * Requires the backend to be running on localhost:3001.
 */
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";

const API_BASE = process.env.API_BASE ?? "http://localhost:3001/api";
const DELAY_MS = 300;
const RESULTS_PATH = path.join(__dirname, "data", "eval-results.json");
const QUESTIONS_PATH = path.join(__dirname, "data", "evaluation-questions.json");

interface Question {
  id: number;
  question_zh: string;
  question_en: string;
  category: string;
  source_url: string;
  source_title: string;
  source_date: string;
  source_column: string;
  hint: string;
}

interface EvalResult {
  id: number;
  category: string;
  question_zh: string;
  hint: string;
  answer: string;
  correct: boolean;
  cited_url: string | null;
  model: string;
  ts: string;
}

interface ResultsFile {
  model: string;
  started_at: string;
  finished_at?: string;
  results: EvalResult[];
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function login(): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: process.env.SEED_ADMIN_USERNAME ?? "admin",
      password: process.env.SEED_ADMIN_PASSWORD ?? "tke2026",
    }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  const data = await res.json() as { accessToken: string };
  return data.accessToken;
}

async function askQuestion(
  token: string,
  message: string,
): Promise<{ answer: string; citations: { url: string }[]; sessionId: string }> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message, locale: "zh-CN" }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Chat API ${res.status}: ${text}`);
  }
  return res.json() as Promise<{ answer: string; citations: { url: string }[]; sessionId: string }>;
}

function isCorrect(answer: string, hint: string, sourceUrl: string, citations: { url: string }[]): boolean {
  // Check hint parts (comma-separated)
  const parts = hint.split(/[,，、]/).map((p) => p.trim()).filter(Boolean);
  const hintMatch = parts.some((p) => answer.includes(p));
  const urlMatch = citations.some((c) => c.url === sourceUrl);
  return hintMatch || urlMatch;
}

async function main() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const limit = get("--limit") ? parseInt(get("--limit")!, 10) : undefined;
  const category = get("--category");
  const startAt = get("--start") ? parseInt(get("--start")!, 10) : 1;

  // Load questions
  const allQuestions: Question[] = JSON.parse(fs.readFileSync(QUESTIONS_PATH, "utf-8"));

  let questions = allQuestions.filter((q) => q.id >= startAt);
  if (category) questions = questions.filter((q) => q.category === category);
  if (limit) questions = questions.slice(0, limit);

  console.log(`Loaded ${allQuestions.length} total questions.`);
  console.log(`Running ${questions.length} questions (start=${startAt}${category ? `, category=${category}` : ""}${limit ? `, limit=${limit}` : ""}).\n`);

  // Load or init results file
  let file: ResultsFile;
  const model = process.env.LLM_MODEL ?? "deepseek/deepseek-v4-flash";

  if (fs.existsSync(RESULTS_PATH) && startAt > 1) {
    file = JSON.parse(fs.readFileSync(RESULTS_PATH, "utf-8")) as ResultsFile;
    console.log(`Resuming from existing results file (${file.results.length} already done).`);
  } else {
    file = { model, started_at: new Date().toISOString(), results: [] };
  }

  const doneIds = new Set(file.results.map((r) => r.id));

  // Login
  const token = await login();
  console.log("Logged in.\n");

  let correct = 0;
  let total = 0;
  const catStats: Record<string, { c: number; t: number }> = {};

  // Seed totals from already-done results if resuming
  for (const r of file.results) {
    if (!catStats[r.category]) catStats[r.category] = { c: 0, t: 0 };
    catStats[r.category].t++;
    if (r.correct) {
      catStats[r.category].c++;
      correct++;
    }
    total++;
  }

  for (const q of questions) {
    if (doneIds.has(q.id)) continue;

    total++;
    if (!catStats[q.category]) catStats[q.category] = { c: 0, t: 0 };
    catStats[q.category].t++;

    let result: EvalResult;
    try {
      const { answer, citations } = await askQuestion(token, q.question_zh);
      const ok = isCorrect(answer, q.hint, q.source_url, citations);
      const citedUrl = citations[0]?.url ?? null;

      if (ok) {
        correct++;
        catStats[q.category].c++;
      }

      result = {
        id: q.id,
        category: q.category,
        question_zh: q.question_zh,
        hint: q.hint,
        answer: answer.slice(0, 1000),
        correct: ok,
        cited_url: citedUrl,
        model,
        ts: new Date().toISOString(),
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result = {
        id: q.id,
        category: q.category,
        question_zh: q.question_zh,
        hint: q.hint,
        answer: `ERROR: ${msg}`,
        correct: false,
        cited_url: null,
        model,
        ts: new Date().toISOString(),
      };
    }

    file.results.push(result);
    doneIds.add(q.id);

    // Save after every question
    fs.writeFileSync(RESULTS_PATH, JSON.stringify(file, null, 2), "utf-8");

    const mark = result.correct ? "✓" : "✗";
    process.stdout.write(
      `[${total}/${questions.length + (startAt > 1 ? file.results.length - questions.length : 0)}] ${mark} Q${q.id} (${q.category}) ${correct}/${total} = ${((correct / total) * 100).toFixed(1)}%\r`,
    );

    await sleep(DELAY_MS);
  }

  file.finished_at = new Date().toISOString();
  fs.writeFileSync(RESULTS_PATH, JSON.stringify(file, null, 2), "utf-8");

  // Final report
  console.log(`\n\n${"=".repeat(60)}`);
  console.log(`EVALUATION RESULTS — Model: ${model}`);
  console.log(`${"=".repeat(60)}`);
  console.log(`Overall: ${correct}/${total} = ${((correct / total) * 100).toFixed(1)}%\n`);
  console.log("By category:");
  for (const [cat, s] of Object.entries(catStats).sort(([a], [b]) => a.localeCompare(b))) {
    console.log(`  ${cat.padEnd(15)} ${s.c}/${s.t} = ${((s.c / s.t) * 100).toFixed(1)}%`);
  }
  console.log(`\nResults saved to: ${RESULTS_PATH}`);
}

main().catch((err) => {
  console.error("Evaluation failed:", err);
  process.exit(1);
});
