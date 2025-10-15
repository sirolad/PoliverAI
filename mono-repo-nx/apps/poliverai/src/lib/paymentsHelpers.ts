export function getApiBaseOrigin(): string | undefined {
  try {
    const envApi = process.env.VITE_API_URL || process.env.API_BASE
    if (envApi && String(envApi).trim() !== '') return String(envApi)
    const mode = process.env.NODE_ENV
    if (mode === 'development') return 'http://localhost:8000'
  } catch {}
  return 'http://localhost:8000'
}
