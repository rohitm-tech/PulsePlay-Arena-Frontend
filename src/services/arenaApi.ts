import api from '@/lib/api';

export type ArenaSummary = {
  season: { id: string; name: string; endsAt: string };
  engagement: Record<string, unknown>;
  progression: { level: number; current: number; next: number; pct: number };
  missions: unknown[];
  achievements: unknown[];
  pass: { maxMilestone: number; premium: boolean; claimedFree: number[]; claimedPremium: number[] };
  profile: { favoriteTeam?: string; lifetimeXp?: number; correctPredictions?: number };
};

export async function fetchArenaSummary() {
  const res = await api.get<{ success: boolean; data: ArenaSummary }>('/api/arena/summary');
  return res.data.data;
}

export async function postArenaHeartbeat(useFreeze?: boolean) {
  const res = await api.post<{ success: boolean; data: unknown }>('/api/arena/heartbeat', { useFreeze });
  return res.data.data;
}

export async function fetchArenaPersonalization() {
  const res = await api.get<{ success: boolean; data: unknown }>('/api/arena/personalization');
  return res.data.data;
}

export async function fetchArenaLeaderboard(kind: 'xp' | 'streak' | 'predictions') {
  const res = await api.get<{ success: boolean; data: unknown[]; kind: string }>(`/api/arena/leaderboard/${kind}`);
  return res.data.data;
}

export async function submitArenaPrediction(body: {
  category: string;
  matchId?: string;
  subjectType: string;
  subjectId: string;
  pick: string;
  confidence?: number;
}) {
  const res = await api.post('/api/arena/predictions', body);
  return res.data;
}

export async function claimArenaPass(milestoneIndex: number, track: 'free' | 'premium') {
  const res = await api.post('/api/arena/pass/claim', { milestoneIndex, track });
  return res.data;
}

export async function unlockArenaPremiumDev() {
  const res = await api.post('/api/arena/pass/premium');
  return res.data;
}
