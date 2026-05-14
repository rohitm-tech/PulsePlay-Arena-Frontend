import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface TournamentPassState {
  maxMilestone: number;
  premium: boolean;
  claimedFree: number[];
  claimedPremium: number[];
}

const initialState: TournamentPassState = {
  maxMilestone: 0,
  premium: false,
  claimedFree: [],
  claimedPremium: [],
};

const tournamentPassSlice = createSlice({
  name: 'tournamentPass',
  initialState,
  reducers: {
    setTournamentPass(state, action: PayloadAction<Partial<TournamentPassState>>) {
      Object.assign(state, action.payload);
    },
  },
});

export const { setTournamentPass } = tournamentPassSlice.actions;
export default tournamentPassSlice.reducer;
