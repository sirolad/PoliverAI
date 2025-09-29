import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import authReducer from './slices/authSlice';
import localeReducer from './slices/localeSlice';
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  PersistConfig,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createWebStorage from 'redux-persist/lib/storage';
import { Platform } from 'react-native';

const rootReducer = combineReducers({
  auth: authReducer,
  locale: localeReducer,
});

const isWeb = Platform.OS === 'web';

const storage = isWeb ? createWebStorage : AsyncStorage;

const persistConfig: PersistConfig<unknown> = {
  key: 'root',
  storage,
  whitelist: ['auth', 'locale'],
};

// redux-persist typings can be tricky with combined reducers; keep the persisted reducer as unknown
// We intentionally cast to unknown to avoid noisy typing issues from redux-persist
// redux-persist typings don't play nicely with combined reducers in some TS configs; cast intentionally
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const persistedReducer = persistReducer(persistConfig, rootReducer as unknown as any);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
