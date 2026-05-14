import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface RewardsState {
  coins: number;
  inventoryIds: string[];
  equippedTitle?: string;
  equippedFrame?: string;
}

const initialState: RewardsState = {
  coins: 0,
  inventoryIds: [],
};

const rewardsSlice = createSlice({
  name: 'rewards',
  initialState,
  reducers: {
    setRewards(state, action: PayloadAction<Partial<RewardsState>>) {
      Object.assign(state, action.payload);
    },
  },
});

export const { setRewards } = rewardsSlice.actions;
export default rewardsSlice.reducer;
