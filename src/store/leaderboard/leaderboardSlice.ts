import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LeaderboardRow {
  _id: string;
  xp: number;
  correctPredictions: number;
  streak: number;
  userId: { _id: string; name?: string; email?: string; avatar?: string; xpPoints?: number };
}

interface LeaderboardState {
  rows: LeaderboardRow[];
}

const initialState: LeaderboardState = { rows: [] };

const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState,
  reducers: {
    setLeaderboard(state, action: PayloadAction<LeaderboardRow[]>) {
      state.rows = action.payload;
    },
  },
});

export const { setLeaderboard } = leaderboardSlice.actions;
export default leaderboardSlice.reducer;
