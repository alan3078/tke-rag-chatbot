interface Citation {
  title: string;
  url: string;
  section: string | null;
  date: string | null;
}

interface CitationListProps {
  citations: Citation[];
}

export function CitationList({ citations }: CitationListProps) {
  if (citations.length === 0) return null;

  return (
    <div className="ml-2 mt-2 p-3 bg-gray-50 rounded-lg border text-sm">
      <p className="font-medium text-gray-600 mb-1">Sources:</p>
      <ul className="space-y-1">
        {citations.map((citation, i) => (
          <li key={i} className="text-gray-500">
            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {citation.title}
            </a>
            {citation.section && (
              <span className="ml-2 text-gray-400">
                [{citation.section}]
              </span>
            )}
            {citation.date && (
              <span className="ml-2 text-gray-400">{citation.date}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
