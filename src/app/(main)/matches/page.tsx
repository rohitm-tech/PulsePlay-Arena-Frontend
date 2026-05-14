'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { RefreshCw, Search } from 'lucide-react';
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
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-ink-500 dark:text-ink-400">Live hub</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900 dark:text-ink-50">Live matches</h1>
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
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100">
            {loadErrorMessage}
          </div>
        ) : null}
        {refreshMutation.isError && refreshErrorMessage ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100">
            Refresh failed: {refreshErrorMessage}
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="relative w-full max-w-md">
            <label htmlFor="matches-search" className="sr-only">
              Search matches
            </label>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden />
            <input
              id="matches-search"
              type="search"
              placeholder="Search teams, venue, status, series…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-10 pr-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus-visible:border-ink-900 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50 dark:focus-visible:border-ink-300"
              autoComplete="off"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">Show</span>
            <div className="flex flex-wrap gap-1.5">
              {TIME_FILTER_OPTIONS.filter((opt) => opt.value !== 'upcoming' || hasUpcoming).map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  size="sm"
                  variant={timeFilter === opt.value ? 'default' : 'outline'}
                  className="shrink-0"
                  onClick={() => setTimeFilter(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">Group by</span>
            <div className="flex flex-wrap gap-1.5">
              {GROUP_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  size="sm"
                  variant={groupMode === opt.value ? 'default' : 'outline'}
                  className="shrink-0"
                  title={opt.hint}
                  onClick={() => setGroupMode(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {!isLoading && !isError && totalCount === 0 ? (
          <p className="mt-8 text-sm text-ink-600 dark:text-ink-400">
            No matches in the database yet. Click “Refresh from API” to fetch the current list from CricAPI and store it.
          </p>
        ) : null}

        {!isLoading && !isError && totalCount > 0 && filtered.length === 0 ? (
          <p className="mt-8 text-sm text-ink-600 dark:text-ink-400">No matches match your search. Try another team or keyword.</p>
        ) : null}

        {!isLoading && !isError && filtered.length > 0 && timeScoped.length === 0 ? (
          <p className="mt-8 text-sm text-ink-600 dark:text-ink-400">
            No matches in this view — try Past, Current
            {hasUpcoming ? ', or Upcoming' : ''}.
          </p>
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
