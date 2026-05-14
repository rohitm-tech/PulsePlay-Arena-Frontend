import api from '@/lib/api';
import type { AuthUser } from '@/store/auth/authSlice';

export async function registerRequest(payload: {
  name: string;
  email: string;
  password: string;
  favoriteTeam?: string;
}): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
  const { data } = await api.post('/api/auth/register', payload);
  return data.data;
}

export async function loginRequest(payload: {
  email: string;
  password: string;
}): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
  const { data } = await api.post('/api/auth/login', payload);
  return data.data;
}

export async function meRequest(): Promise<AuthUser> {
  const { data } = await api.get('/api/auth/me');
  return data.data;
}

export async function patchMeRequest(payload: {
  name?: string;
  favoriteTeam?: string | null;
  favoritePlayers?: string[];
  notificationPrefs?: Partial<NonNullable<AuthUser['notificationPrefs']>>;
}): Promise<AuthUser> {
  const { data } = await api.patch('/api/users/me', payload);
  return data.data;
}

export type NotificationItem = {
  _id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt?: string;
};

export async function listNotificationsRequest(): Promise<{ items: NotificationItem[]; unread: number }> {
  const { data } = await api.get('/api/users/me/notifications');
  return data.data;
}

export async function markNotificationReadRequest(id: string): Promise<void> {
  await api.patch(`/api/users/me/notifications/${id}/read`);
}

export async function claimAchievementsRequest(): Promise<AuthUser> {
  const { data } = await api.post('/api/users/me/achievements/claim');
  return data.data;
}
