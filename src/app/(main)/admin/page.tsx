'use client';

import { useState } from 'react';
import { AuthGate } from '@/components/AuthGate';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAppSelector } from '@/store/hooks';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';

export default function AdminPage() {
  const role = useAppSelector((s) => s.auth.user?.role);
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Record<string, number> | null>(null);
  const [question, setQuestion] = useState('Will this over go above 15 runs?');
  const [matchId, setMatchId] = useState('mock-ipl-1');
  const [expires, setExpires] = useState(() => new Date(Date.now() + 3600000).toISOString().slice(0, 16));
  const [hydrateCommentary, setHydrateCommentary] = useState(false);
  const [genLoading, setGenLoading] = useState(false);

  if (role !== 'admin') {
    return (
      <AuthGate>
        <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
          <PageContainer className="text-center text-ink-600 dark:text-ink-400">Admin only.</PageContainer>
        </div>
      </AuthGate>
    );
  }

  async function loadAnalytics() {
    const res = await api.get('/api/admin/analytics');
    setAnalytics(res.data.data);
    toast.success('Analytics loaded');
  }

  async function generateFromCommentary() {
    setGenLoading(true);
    try {
      await api.post('/api/polls/generate-from-commentary', {
        matchId: matchId.trim(),
        hoursValid: 6,
        hydrateIfEmpty: hydrateCommentary,
      });
      toast.success('Gemini poll created from commentary');
    } catch (e) {
      const msg =
        typeof e === 'object' &&
        e !== null &&
        'response' in e &&
        typeof (e as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
          ? String((e as { response: { data: { message: string } } }).response.data.message)
          : 'Failed to generate poll';
      toast.error(msg);
    } finally {
      setGenLoading(false);
    }
  }

  async function createPoll() {
    try {
      await api.post('/api/polls', {
        question,
        options: ['Yes', 'No'],
        matchId,
        expiresAt: new Date(expires).toISOString(),
        correctAnswer: 'Yes',
      });
      toast.success('Poll created');
    } catch {
      toast.error('Failed to create poll');
    }
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
        <PageContainer className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-ink-900 dark:text-ink-50">Admin</h1>
            <Button type="button" variant="ghost" onClick={() => router.push('/matches')}>
              Back to matches
            </Button>
          </div>
          <Card>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>Lightweight counters from the API.</CardDescription>
            <Button type="button" variant="secondary" className="mt-4" onClick={() => void loadAnalytics()}>
              Refresh
            </Button>
            {analytics && (
              <pre className="mt-4 max-h-48 overflow-auto rounded-xl border border-ink-200 bg-ink-50 p-4 text-xs text-ink-800 dark:border-ink-800 dark:bg-ink-950 dark:text-ink-200">
                {JSON.stringify(analytics, null, 2)}
              </pre>
            )}
          </Card>
          <Card>
            <CardTitle>Manual poll</CardTitle>
            <CardDescription>Publishes over Socket.IO to match rooms.</CardDescription>
            <div className="mt-6 space-y-4">
              <input
                className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
              <input
                className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50"
                value={matchId}
                onChange={(e) => setMatchId(e.target.value)}
              />
              <input
                type="datetime-local"
                className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50"
                value={expires}
                onChange={(e) => setExpires(e.target.value)}
              />
              <Button type="button" onClick={() => void createPoll()}>
                Publish poll
              </Button>
            </div>
          </Card>
          <Card>
            <CardTitle>Gemini poll from commentary</CardTitle>
            <CardDescription>
              Reads cached ball-by-ball lines in Mongo for this match ID, then asks Gemini for a question + options + correct
              answer. Requires GEMINI_API_KEY; optional one-shot CricAPI fetch if the cache is empty.
            </CardDescription>
            <div className="mt-6 space-y-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-700 dark:text-ink-300">
                <input
                  type="checkbox"
                  checked={hydrateCommentary}
                  onChange={(e) => setHydrateCommentary(e.target.checked)}
                  className="rounded border-ink-300"
                />
                If DB has no commentary, fetch once (needs CRIC_API_KEY)
              </label>
              <Button type="button" variant="secondary" disabled={genLoading} onClick={() => void generateFromCommentary()}>
                {genLoading ? 'Generating…' : 'Generate & publish'}
              </Button>
            </div>
          </Card>
        </PageContainer>
      </div>
    </AuthGate>
  );
}
