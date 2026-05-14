import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { config } from '@/config';
import type { RootState } from '@/store';
import type { AppDispatch } from '@/store';
import { setTokens, logout } from '@/store/auth/authSlice';

type StoreLike = {
  getState: () => RootState;
  dispatch: AppDispatch;
};

let storeRef: StoreLike | null = null;

export function injectStore(s: StoreLike) {
  storeRef = s;
}

const api = axios.create({
  baseURL: config.apiUrl,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((reqConfig: InternalAxiosRequestConfig) => {
  const token = storeRef?.getState().auth.accessToken;
  if (token) reqConfig.headers.Authorization = `Bearer ${token}`;
  return reqConfig;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = storeRef?.getState().auth.refreshToken;
  if (!refreshToken) return null;
  const { data } = await axios.post(`${config.apiUrl}/api/auth/refresh`, { refreshToken });
  const accessToken = data?.data?.accessToken as string | undefined;
  const newRefresh = data?.data?.refreshToken as string | undefined;
  if (!accessToken) return null;
  storeRef?.dispatch(setTokens({ accessToken, refreshToken: newRefresh }));
  return accessToken;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        if (!refreshPromise) refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const newAccess = await refreshPromise;
        if (newAccess) {
          original.headers.Authorization = `Bearer ${newAccess}`;
          return api(original);
        }
      } catch {
        /* fall through */
      }
      storeRef?.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

export default api;
