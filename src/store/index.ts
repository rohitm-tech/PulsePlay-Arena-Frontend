import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import authReducer from './auth/authSlice';
import matchesReducer from './matches/matchesSlice';
import socketReducer from './socket/socketSlice';
import pollsReducer from './polls/pollsSlice';
import leaderboardReducer from './leaderboard/leaderboardSlice';
import reactionsReducer from './reactions/reactionsSlice';
import chatReducer from './chat/chatSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  matches: matchesReducer,
  socket: socketReducer,
  polls: pollsReducer,
  leaderboard: leaderboardReducer,
  reactions: reactionsReducer,
  chat: chatReducer,
});

const persistedReducer = persistReducer(
  {
    key: 'pulseplay',
    storage,
    whitelist: ['auth'],
  },
  rootReducer
);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
