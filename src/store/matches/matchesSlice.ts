import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface MatchSummary {
  id: string;
  name: string;
  status: string;
  venue?: string;
  date?: string;
  teams?: string[];
  teamInfo?: Record<string, { name: string; shortname?: string }>;
  score?: unknown[];
}

interface MatchesState {
  live: MatchSummary[];
  detail: MatchSummary | null;
  commentary: Array<{ id: string; over: string; ball: string; text: string; event?: unknown }>;
  liveScoreById: Record<string, unknown>;
}

const initialState: MatchesState = {
  live: [],
  detail: null,
  commentary: [],
  liveScoreById: {},
};

const matchesSlice = createSlice({
  name: 'matches',
  initialState,
  reducers: {
    setLiveMatches(state, action: PayloadAction<MatchSummary[]>) {
      state.live = action.payload;
    },
    setMatchDetail(state, action: PayloadAction<MatchSummary | null>) {
      state.detail = action.payload;
    },
    setCommentary(state, action: PayloadAction<MatchesState['commentary']>) {
      state.commentary = action.payload;
    },
    appendCommentary(state, action: PayloadAction<MatchesState['commentary'][number]>) {
      state.commentary.push(action.payload);
      if (state.commentary.length > 120) state.commentary = state.commentary.slice(-120);
    },
    setLiveScore(state, action: PayloadAction<{ matchId: string; payload: unknown }>) {
      state.liveScoreById[action.payload.matchId] = action.payload.payload;
    },
  },
});

export const { setLiveMatches, setMatchDetail, setCommentary, appendCommentary, setLiveScore } =
  matchesSlice.actions;
export default matchesSlice.reducer;
