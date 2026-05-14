import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ChatMessage {
  id: string;
  userName: string;
  text: string;
  createdAt?: string;
}

interface ChatState {
  byRoom: Record<string, ChatMessage[]>;
  typing: Record<string, string[]>;
}

const initialState: ChatState = { byRoom: {}, typing: {} };

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setMessages(state, action: PayloadAction<{ room: string; messages: ChatMessage[] }>) {
      state.byRoom[action.payload.room] = action.payload.messages;
    },
    appendMessage(state, action: PayloadAction<{ room: string; message: ChatMessage }>) {
      const { room, message } = action.payload;
      if (!state.byRoom[room]) state.byRoom[room] = [];
      state.byRoom[room].push(message);
    },
    setTyping(state, action: PayloadAction<{ room: string; users: string[] }>) {
      state.typing[action.payload.room] = action.payload.users;
    },
  },
});

export const { setMessages, appendMessage, setTyping } = chatSlice.actions;
export default chatSlice.reducer;
