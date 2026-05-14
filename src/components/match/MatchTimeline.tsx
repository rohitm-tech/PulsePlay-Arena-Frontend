'use client';

const kindStyles: Record<string, string> = {
  SIX: 'bg-amber-500/20 text-amber-900 dark:text-amber-100',
  FOUR: 'bg-sky-500/15 text-sky-900 dark:text-sky-100',
  WICKET: 'bg-red-500/15 text-red-900 dark:text-red-100',
  WIN: 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-100',
  FIFTY: 'bg-violet-500/15 text-violet-900 dark:text-violet-100',
  CENTURY: 'bg-purple-500/20 text-purple-900 dark:text-purple-100',
};

export function MatchTimeline({
  items,
}: {
  items: { id: string; over: string; label: string; kind: string }[];
}) {
  if (!items.length) {
    return <p className="text-sm text-ink-500 dark:text-ink-400">Key moments appear as the feed picks up structured events.</p>;
  }
  return (
    <ol className="relative border-s border-ink-200 ps-4 dark:border-ink-700">
      {items.map((it) => (
        <li key={it.id} className="mb-4 last:mb-0">
          <span className="absolute -start-1.5 mt-1.5 h-3 w-3 rounded-full border border-ink-300 bg-white dark:border-ink-600 dark:bg-ink-900" />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-ink-500 dark:text-ink-400">Ov {it.over}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${
                kindStyles[it.kind] ?? 'bg-ink-100 text-ink-800 dark:bg-ink-800 dark:text-ink-100'
              }`}
            >
              {it.label}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}
