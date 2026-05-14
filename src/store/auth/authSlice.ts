import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  favoriteTeam?: string;
  favoritePlayers?: string[];
  notificationPrefs?: {
    boundaries: boolean;
    wickets: boolean;
    milestones: boolean;
    polls: boolean;
  };
  followingCount?: number;
  fanTier?: number;
  xpPoints: number;
  badges: string[];
  role: 'user' | 'admin';
  correctPredictions: number;
  streak: number;
  createdAt?: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ user: AuthUser; accessToken: string; refreshToken: string }>
    ) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    setTokens(state, action: PayloadAction<{ accessToken: string; refreshToken?: string }>) {
      state.accessToken = action.payload.accessToken;
      if (action.payload.refreshToken) state.refreshToken = action.payload.refreshToken;
    },
    setUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
    },
  },
});

export const { setCredentials, setTokens, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
