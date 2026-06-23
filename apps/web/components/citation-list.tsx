import type { Citation } from "@/types";

interface CitationListProps {
  citations: Citation[];
}

export function CitationList({ citations }: CitationListProps) {
  if (citations.length === 0) return null;

  return (
    <div className="ml-2 mt-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
        Sources:
      </p>
      <ul className="space-y-1">
        {citations.map((citation, i) => (
          <li key={i} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-600">
            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#7A1F2B] hover:underline"
            >
              {citation.title}
            </a>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs uppercase tracking-[0.18em] text-slate-400">
              {citation.section && <span>[{citation.section}]</span>}
              {citation.date && <span>{citation.date}</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
