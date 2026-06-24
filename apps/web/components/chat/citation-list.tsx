import { useI18n } from "@/providers/i18n-provider";
import type { Citation } from "@/types";

interface CitationListProps {
  citations: Citation[];
}

export function CitationList({ citations }: CitationListProps) {
  const { t, locale } = useI18n();
  if (citations.length === 0) return null;

  return (
    <div className="ml-2 mt-3 rounded-2xl border bg-muted/50 p-4 text-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {locale === "zh-CN" ? t("chat.sources") : t("chat.sourcesLabel")}
      </p>
      <ul className="space-y-1">
        {citations.map((citation, i) => (
          <li key={i} className="flex gap-3 rounded-xl border bg-card px-3 py-2 text-muted-foreground">
            {citation.imageUrl && (
              <img
                src={citation.imageUrl}
                alt=""
                className="h-14 w-14 shrink-0 rounded-lg object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <div className="min-w-0 flex-1">
              <a
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                {citation.title}
              </a>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs uppercase tracking-[0.18em] text-muted-foreground/60">
                {citation.section && <span>[{citation.section}]</span>}
                {citation.date && <span>{citation.date}</span>}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
