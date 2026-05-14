import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface ProgressionState {
  level: number;
  current: number;
  next: number;
  pct: number;
  seasonXp: number;
  fanRank: string;
  prestigeTier: number;
}

const initialState: ProgressionState = {
  level: 1,
  current: 0,
  next: 100,
  pct: 0,
  seasonXp: 0,
  fanRank: 'Rookie',
  prestigeTier: 0,
};

const progressionSlice = createSlice({
  name: 'progression',
  initialState,
  reducers: {
    setProgression(state, action: PayloadAction<Partial<ProgressionState>>) {
      Object.assign(state, action.payload);
    },
    resetProgression: () => initialState,
  },
});

export const { setProgression, resetProgression } = progressionSlice.actions;
export default progressionSlice.reducer;
