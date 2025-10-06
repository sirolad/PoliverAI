import { configureStore, combineReducers } from '@reduxjs/toolkit'
import deletedReportsReducer from './deletedReportsSlice'
import paymentsReducer from './paymentsSlice'
import uiReducer from './uiSlice'
import authReducer from './authSlice'
import policyAnalysisReducer from './policyAnalysisSlice'
import storage from 'redux-persist/lib/storage'
import { persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist'

const reducers = combineReducers({
  deletedReports: deletedReportsReducer,
  payments: paymentsReducer,
  ui: uiReducer,
  policyAnalysis: policyAnalysisReducer,
  auth: authReducer,
})

const persistConfig = {
  key: 'poliverai',
  storage,
  whitelist: ['payments', 'auth', 'ui', 'deletedReports', 'policyAnalysis'],
}

const persistedReducer = persistReducer(persistConfig, reducers)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist action types which carry non-serializable values
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

// Note: persistence to localStorage was previously handled manually for legacy
// keys (see `bootstrapLegacyLocalStorage`). We now use redux-persist for
// intentional persisted slices. The rest of the store remains in memory.

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
