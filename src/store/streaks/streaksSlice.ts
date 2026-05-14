import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface StreaksState {
  login: number;
  prediction: number;
  participation: number;
  freezesRemaining: number;
}

const initialState: StreaksState = {
  login: 0,
  prediction: 0,
  participation: 0,
  freezesRemaining: 1,
};

const streaksSlice = createSlice({
  name: 'streaks',
  initialState,
  reducers: {
    setStreaks(state, action: PayloadAction<Partial<StreaksState>>) {
      Object.assign(state, action.payload);
    },
    resetStreaks: () => initialState,
  },
});

export const { setStreaks, resetStreaks } = streaksSlice.actions;
export default streaksSlice.reducer;
