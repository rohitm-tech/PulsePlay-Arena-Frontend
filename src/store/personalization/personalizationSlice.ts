import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface PersonalizationState {
  headline: string;
  missionsIdea: string[];
  predictionIdeas: string[];
  reminder: string;
  loaded: boolean;
}

const initialState: PersonalizationState = {
  headline: '',
  missionsIdea: [],
  predictionIdeas: [],
  reminder: '',
  loaded: false,
};

const personalizationSlice = createSlice({
  name: 'personalization',
  initialState,
  reducers: {
    setPersonalization(state, action: PayloadAction<Partial<PersonalizationState>>) {
      Object.assign(state, action.payload);
      state.loaded = true;
    },
    resetPersonalization: () => initialState,
  },
});

export const { setPersonalization, resetPersonalization } = personalizationSlice.actions;
export default personalizationSlice.reducer;
