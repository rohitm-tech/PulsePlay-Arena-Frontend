'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import Link from 'next/link';
import { CalendarClock, Inbox, Layers, RefreshCw, Search, type LucideIcon } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import type { MatchSummary } from '@/store/matches/matchesSlice';
import { useAppSelector } from '@/store/hooks';
import { LiveMatchCard } from '@/components/match/LiveMatchCard';
import {
  filterMatchesByQuery,
  groupMatches,
  matchTimeBucket,
  sortMatchesLatestFirst,
  type LiveMatchesGroupMode,
  type MatchTimeBucket,
} from '@/lib/liveMatchesUi';
import { cn } from '@/lib/utils';

type LiveMatchesResponse = { data: MatchSummary[]; updatedAt?: string | null };

async function fetchLiveMatches(forYou: boolean): Promise<{ matches: MatchSummary[]; updatedAt: string | null }> {
  const url = forYou ? '/api/matches/feed/for-you' : '/api/matches/live';
  const res = await api.get<LiveMatchesResponse>(url);
  return { matches: res.data.data, updatedAt: res.data.updatedAt ?? null };
}

const GROUP_OPTIONS: { value: LiveMatchesGroupMode; label: string; hint: string }[] = [
  { value: 'none', label: 'List', hint: 'Single grid — every match' },
  { value: 'date', label: 'Date', hint: 'Group by match day' },
  { value: 'series', label: 'Series', hint: 'From the tail of the match title' },
  { value: 'gender', label: 'Gender', hint: "Inferred from Men's / Women's in the title" },
  { value: 'venueRegion', label: 'Region', hint: 'Last segment of the venue line' },
  { value: 'india', label: 'India', hint: 'India vs international — default view' },
];

const TIME_FILTER_OPTIONS: { value: MatchTimeBucket; label: string }[] = [
  { value: 'past', label: 'Past' },
  { value: 'current', label: 'Current' },
  { value: 'upcoming', label: 'Upcoming' },
];

function FilterToolbarLabel({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500 dark:text-ink-400">
      <Icon className="h-3.5 w-3.5 opacity-70" aria-hidden />
      {children}
    </p>
  );
}

function SegmentedChip({
  selected,
  onClick,
  children,
  title,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        'rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 sm:px-3.5 sm:text-sm',
        selected
          ? 'bg-ink-900 text-ink-50 shadow-sm dark:bg-ink-100 dark:text-ink-950'
          : 'text-ink-600 hover:bg-white/95 dark:text-ink-300 dark:hover:bg-ink-800/90'
      )}
    >
      {children}
    </button>
  );
}

export default function MatchesPage() {
  const [forYou, setForYou] = useState(false);
  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState<MatchTimeBucket>('current');
  const [groupMode, setGroupMode] = useState<LiveMatchesGroupMode>('india');
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['matches', forYou ? 'for-you' : 'live'],
    enabled: !forYou || !!accessToken,
    queryFn: () => fetchLiveMatches(forYou),
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<LiveMatchesResponse>('/api/matches/live/refresh');
      return { matches: res.data.data, updatedAt: res.data.updatedAt ?? null };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });

  const loadErrorMessage =
    isAxiosError(error) && error.response?.data && typeof error.response.data === 'object' && 'message' in error.response.data
      ? String((error.response.data as { message?: string }).message)
      : isAxiosError(error)
        ? error.message
        : null;

  const refreshErrorMessage =
    isAxiosError(refreshMutation.error) &&
    refreshMutation.error.response?.data &&
    typeof refreshMutation.error.response.data === 'object' &&
    'message' in refreshMutation.error.response.data
      ? String((refreshMutation.error.response.data as { message?: string }).message)
      : isAxiosError(refreshMutation.error)
        ? refreshMutation.error.message
        : null;

  const rawMatches = data?.matches;
  const updatedAt = data?.updatedAt;

  const filtered = useMemo(() => filterMatchesByQuery(rawMatches ?? [], search), [rawMatches, search]);
  const ordered = useMemo(() => sortMatchesLatestFirst(filtered), [filtered]);
  const hasUpcoming = useMemo(() => ordered.some((m) => matchTimeBucket(m) === 'upcoming'), [ordered]);
  const timeScoped = useMemo(
    () => ordered.filter((m) => matchTimeBucket(m) === timeFilter),
    [ordered, timeFilter]
  );
  const sections = useMemo(() => groupMatches(timeScoped, groupMode), [timeScoped, groupMode]);

  useEffect(() => {
    if (!hasUpcoming && timeFilter === 'upcoming') setTimeFilter('current');
  }, [hasUpcoming, timeFilter]);

  const totalCount = rawMatches?.length ?? 0;

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      <PageContainer>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-ink-500 dark:text-ink-400">Match center</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900 dark:text-ink-50">Matches</h1>
            <p className="mt-2 max-w-xl text-sm text-ink-600 dark:text-ink-400">
              Matches are loaded from MongoDB. CricAPI runs only when you use Refresh (set CRIC_API_KEY on the backend).
              “For you” reorders the same snapshot by your favorite team from profile.
            </p>
            {updatedAt ? (
              <p className="mt-2 text-xs text-ink-500 dark:text-ink-400">Last snapshot: {new Date(updatedAt).toLocaleString()}</p>
            ) : (
              <p className="mt-2 text-xs text-ink-500 dark:text-ink-400">No snapshot yet — press Refresh to pull from CricAPI.</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={refreshMutation.isPending}
              className="gap-2"
              onClick={() => refreshMutation.mutate()}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
              Refresh from API
            </Button>
            <Button type="button" size="sm" variant={forYou ? 'default' : 'outline'} onClick={() => setForYou(true)}>
              For you
            </Button>
            <Button type="button" size="sm" variant={!forYou ? 'default' : 'outline'} onClick={() => setForYou(false)}>
              All live
            </Button>
          </div>
        </div>
        {isError && loadErrorMessage ? (
          <div className="mt-8 rounded-2xl border border-ink-300/90 bg-ink-100/90 p-4 text-sm text-ink-900 dark:border-ink-600 dark:bg-ink-900/80 dark:text-ink-100">
            {loadErrorMessage}
          </div>
        ) : null}
        {refreshMutation.isError && refreshErrorMessage ? (
          <div className="mt-4 rounded-2xl border border-ink-300/90 bg-ink-100/90 p-4 text-sm text-ink-900 dark:border-ink-600 dark:bg-ink-900/80 dark:text-ink-100">
            Refresh failed: {refreshErrorMessage}
          </div>
        ) : null}

        <section
          className="mt-8 overflow-hidden rounded-2xl border border-ink-200/80 bg-gradient-to-b from-white to-ink-50/80 shadow-sm dark:border-ink-800/80 dark:from-ink-950 dark:to-ink-900/90"
          aria-label="Search and filters"
        >
          <div className="border-b border-ink-200/50 bg-white/70 px-4 py-3 backdrop-blur-sm dark:border-ink-800/50 dark:bg-ink-950/50">
            <div className="relative">
              <label htmlFor="matches-search" className="sr-only">
                Search matches
              </label>
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400 dark:text-ink-500"
                aria-hidden
              />
              <input
                id="matches-search"
                type="search"
                placeholder="Search teams, venue, status, series…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border-0 bg-ink-50/90 py-3 pl-11 pr-4 text-sm text-ink-900 shadow-inner shadow-ink-900/5 outline-none ring-1 ring-ink-200/80 transition placeholder:text-ink-400 focus:ring-2 focus:ring-ink-900/25 dark:bg-ink-900/80 dark:text-ink-50 dark:shadow-black/20 dark:ring-ink-700/80 dark:placeholder:text-ink-500 dark:focus:ring-ink-100/30"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-2">
            <div>
              <FilterToolbarLabel icon={CalendarClock}>When</FilterToolbarLabel>
              <div
                className="inline-flex flex-wrap gap-0.5 rounded-xl bg-ink-100/90 p-1 ring-1 ring-ink-200/60 dark:bg-ink-950/90 dark:ring-ink-800/80"
                role="group"
                aria-label="Match time filter"
              >
                {TIME_FILTER_OPTIONS.filter((opt) => opt.value !== 'upcoming' || hasUpcoming).map((opt) => (
                  <SegmentedChip
                    key={opt.value}
                    selected={timeFilter === opt.value}
                    onClick={() => setTimeFilter(opt.value)}
                  >
                    {opt.label}
                  </SegmentedChip>
                ))}
              </div>
            </div>
            <div>
              <FilterToolbarLabel icon={Layers}>Group by</FilterToolbarLabel>
              <div
                className="flex flex-wrap gap-0.5 rounded-xl bg-ink-100/90 p-1 ring-1 ring-ink-200/60 dark:bg-ink-950/90 dark:ring-ink-800/80"
                role="group"
                aria-label="Grouping mode"
              >
                {GROUP_OPTIONS.map((opt) => (
                  <SegmentedChip
                    key={opt.value}
                    selected={groupMode === opt.value}
                    title={opt.hint}
                    onClick={() => setGroupMode(opt.value)}
                  >
                    {opt.label}
                  </SegmentedChip>
                ))}
              </div>
            </div>
          </div>
        </section>

        {!isLoading && !isError && totalCount === 0 ? (
          <div className="mt-8 overflow-hidden rounded-2xl border border-dashed border-ink-300/90 bg-white/70 dark:border-ink-600/80 dark:bg-ink-900/50">
            <div className="flex flex-col items-center gap-4 px-6 py-10 text-center sm:px-10">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200/90 bg-ink-50 dark:border-ink-700 dark:bg-ink-900">
                <Inbox className="h-7 w-7 text-ink-600 dark:text-ink-300" aria-hidden />
              </span>
              <div className="max-w-md space-y-2">
                <h2 className="text-lg font-semibold tracking-tight text-ink-900 dark:text-ink-50">No snapshot yet</h2>
                <p className="text-sm leading-relaxed text-ink-600 dark:text-ink-400">
                  Your match list is stored in MongoDB and only updates when you refresh from CricAPI (backend needs{' '}
                  <code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs dark:bg-ink-800">CRIC_API_KEY</code>).
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  type="button"
                  size="default"
                  disabled={refreshMutation.isPending}
                  className="gap-2"
                  onClick={() => refreshMutation.mutate()}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} aria-hidden />
                  Pull matches from API
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/arena" className="gap-2">
                    Go to Arena
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {!isLoading && !isError && totalCount > 0 && filtered.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-ink-200/80 bg-ink-50/80 px-5 py-6 text-center dark:border-ink-800/80 dark:bg-ink-900/40">
            <p className="text-sm font-medium text-ink-900 dark:text-ink-100">No results for that search</p>
            <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">Try a shorter team code, venue, or status keyword.</p>
            <Button type="button" variant="link" className="mt-2 h-auto p-0 text-ink-900 dark:text-ink-50" onClick={() => setSearch('')}>
              Clear search
            </Button>
          </div>
        ) : null}

        {!isLoading && !isError && filtered.length > 0 && timeScoped.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-ink-200/90 bg-ink-50/70 px-5 py-6 text-center dark:border-ink-700/80 dark:bg-ink-900/50">
            <p className="text-sm font-medium text-ink-900 dark:text-ink-100">Nothing in this time window</p>
            <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">
              Switch to Past or Current
              {hasUpcoming ? ', or Upcoming' : ''} — filters apply on top of your snapshot.
            </p>
          </div>
        ) : null}

        <div className="mt-10 space-y-12">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl border border-ink-200/60 bg-ink-100/80 dark:border-ink-800/60 dark:bg-ink-900/40" />
            ))}

          {!isLoading &&
            sections.map((section) => (
              <section key={section.heading || 'all'} className="min-w-0">
                {section.heading ? (
                  <h2 className="mb-4 border-b border-ink-200/80 pb-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-600 dark:border-ink-700/80 dark:text-ink-300">
                    {section.heading}
                  </h2>
                ) : null}
                <ul className="grid list-none grid-cols-1 gap-4 lg:grid-cols-2">
                  {section.items.map((m, idx) => (
                    <LiveMatchCard key={m.id} match={m} index={idx} />
                  ))}
                </ul>
              </section>
            ))}
        </div>
      </PageContainer>
    </div>
  );
}
