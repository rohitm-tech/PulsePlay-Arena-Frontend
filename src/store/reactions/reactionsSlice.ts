import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ReactionBurst {
  id: string;
  matchId: string;
  emoji: string;
  ts: number;
}

interface ReactionsState {
  recent: ReactionBurst[];
}

const initialState: ReactionsState = { recent: [] };

const reactionsSlice = createSlice({
  name: 'reactions',
  initialState,
  reducers: {
    pushReaction(state, action: PayloadAction<Omit<ReactionBurst, 'id'> & { id?: string }>) {
      const id = action.payload.id ?? `${action.payload.ts}-${Math.random().toString(36).slice(2)}`;
      state.recent.unshift({ ...action.payload, id });
      state.recent = state.recent.slice(0, 40);
    },
    clearReactions(state) {
      state.recent = [];
    },
  },
});

export const { pushReaction, clearReactions } = reactionsSlice.actions;
export default reactionsSlice.reducer;
