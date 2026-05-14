import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type MissionRow = {
  _id: string;
  key: string;
  title: string;
  description: string;
  cadence: string;
  target: number;
  progress: number;
  xpReward: number;
  coinReward: number;
  completed: boolean;
  expiresAt: string;
};

const initialState: { missions: MissionRow[] } = { missions: [] };

const questsSlice = createSlice({
  name: 'quests',
  initialState,
  reducers: {
    setQuests(state, action: PayloadAction<MissionRow[]>) {
      state.missions = action.payload;
    },
  },
});

export const { setQuests } = questsSlice.actions;
export default questsSlice.reducer;
