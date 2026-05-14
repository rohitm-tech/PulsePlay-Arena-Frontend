import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SocketState {
  connected: boolean;
  lastError?: string | null;
}

const initialState: SocketState = {
  connected: false,
  lastError: null,
};

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    setSocketStatus(state, action: PayloadAction<{ connected: boolean; error?: string | null }>) {
      state.connected = action.payload.connected;
      state.lastError = action.payload.error ?? null;
    },
  },
});

export const { setSocketStatus } = socketSlice.actions;
export default socketSlice.reducer;
