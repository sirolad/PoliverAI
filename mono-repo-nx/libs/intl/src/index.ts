import React from 'react'

let currentToken: string | null = null

export function getToken(): string | null {
  return currentToken
}

export function setToken(token: string | null) {
  currentToken = token
}

export const AuthContext = React.createContext<{ token: string | null; setToken: (t: string | null) => void }>({ token: null, setToken: () => {} })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, _setToken] = React.useState<string | null>(null)
  React.useEffect(() => {
    // sync module-level token for simple synchronous access
    currentToken = token
  }, [token])
  return <AuthContext.Provider value={{ token, setToken: _setToken }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  return ctx
}

export default {
  getToken,
  setToken,
  AuthProvider,
  useAuth,
}
export { ReduxProvider } from './provider';
export * from './store';
export * from './slices/authSlice';
export * from './slices/localeSlice';
export { useTranslation } from './i18n';
export { AuthProvider, useAuth } from './hooks/useAuth';
export { cn } from './utils/cn';
