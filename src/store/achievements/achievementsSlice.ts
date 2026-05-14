import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type AchievementRow = {
  id: string;
  title: string;
  description: string;
  rarity: string;
  hidden?: boolean;
  unlocked?: boolean;
  unlockedAt?: string;
};

const initialState: { items: AchievementRow[] } = { items: [] };

const achievementsSlice = createSlice({
  name: 'achievements',
  initialState,
  reducers: {
    setAchievements(state, action: PayloadAction<AchievementRow[]>) {
      state.items = action.payload;
    },
  },
});

export const { setAchievements } = achievementsSlice.actions;
export default achievementsSlice.reducer;
