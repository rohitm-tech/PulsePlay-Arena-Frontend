'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { MatchSummary } from '@/store/matches/matchesSlice';

type LiveMatchCardProps = {
  match: MatchSummary;
  index: number;
};

export function LiveMatchCard({ match: m, index }: LiveMatchCardProps) {
  return (
    <motion.li
      className="min-w-0"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Link
        href={`/match/${m.id}`}
        className="group flex min-h-full min-w-0 flex-col gap-3 rounded-2xl border border-ink-200/80 bg-white/80 p-5 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-ink-400 dark:border-ink-800/80 dark:bg-ink-950/55 dark:hover:border-ink-500 sm:p-6"
      >
        <div className="min-w-0 space-y-2">
          <h2 className="text-balance break-words text-lg font-semibold leading-snug text-ink-900 transition group-hover:text-ink-950 dark:text-ink-50 dark:group-hover:text-white">
            {m.name}
          </h2>
          <p
            className="break-words text-xs font-medium leading-relaxed text-ink-700 dark:text-ink-200 sm:text-sm"
            title={m.status}
          >
            {m.status}
          </p>
        </div>
        {m.venue ? (
          <p className="min-w-0 break-words text-sm text-ink-500 dark:text-ink-400">{m.venue}</p>
        ) : null}
        {m.date ? (
          <p className="text-xs text-ink-500 dark:text-ink-500">
            {(() => {
              const d = new Date(m.date!);
              return Number.isNaN(d.getTime())
                ? m.date
                : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
            })()}
          </p>
        ) : null}
        <p className="mt-auto pt-1 text-xs font-medium uppercase tracking-wide text-ink-400 opacity-0 transition group-hover:opacity-100 dark:text-ink-500">
          Open match room →
        </p>
      </Link>
    </motion.li>
  );
}
