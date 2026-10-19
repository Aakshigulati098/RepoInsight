
function normalizeList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];

  const trimmed = value.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);

      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // Fall back to splitting ordinary text.
    }
  }

  return trimmed
    .split(/\r?\n|,/)
    .map((item) => item.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
}

export default function DataList({
  items,
  emptyMessage = 'No data available.',
}) {
  const values = normalizeList(items);

  if (!values.length) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-2">
      {values.map((item, index) => {
        const label =
          typeof item === 'string'
            ? item
            : item?.path || item?.name || item?.filePath || JSON.stringify(item);

        return (
          <li
            key={`${index}-${label}`}
            className="break-words rounded-lg border border-slate-800 bg-[#0b1120] px-3 py-2 text-sm text-slate-300"
          >
            {label}
          </li>
        );
      })}
    </ul>
  );
}
