import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PollDto {
  _id: string;
  question: string;
  options: string[];
  matchId: string;
  expiresAt: string;
  status: string;
  votes?: { userId: string; option: string }[];
}

interface PollsState {
  byMatch: Record<string, PollDto[]>;
}

const initialState: PollsState = { byMatch: {} };

const pollsSlice = createSlice({
  name: 'polls',
  initialState,
  reducers: {
    setPollsForMatch(state, action: PayloadAction<{ matchId: string; polls: PollDto[] }>) {
      state.byMatch[action.payload.matchId] = action.payload.polls;
    },
    upsertPoll(state, action: PayloadAction<PollDto>) {
      const p = action.payload;
      const list = state.byMatch[p.matchId] ?? [];
      const idx = list.findIndex((x) => x._id === p._id);
      if (idx >= 0) list[idx] = p;
      else list.unshift(p);
      state.byMatch[p.matchId] = list;
    },
  },
});

export const { setPollsForMatch, upsertPoll } = pollsSlice.actions;
export default pollsSlice.reducer;
