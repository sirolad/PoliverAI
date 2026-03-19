const FALLBACK_API_BASE = 'https://poliverai.com'

function readEnv(name: string): string | undefined {
  const processValue =
    typeof process !== 'undefined' && process.env
      ? process.env[name]
      : undefined;

  if (typeof processValue === 'string' && processValue.trim() !== '') {
    return processValue;
  }

  const globalEnv =
    typeof globalThis !== 'undefined'
      ? (globalThis as { __POLIVERAI_ENV__?: Record<string, unknown> }).__POLIVERAI_ENV__
      : undefined;
  const globalValue = globalEnv?.[name];

  return typeof globalValue === 'string' && globalValue.trim() !== ''
    ? globalValue
    : undefined;
}

export function getApiBaseOrigin(): string {
  const apiUrl = readEnv('VITE_API_BASE_URL') ?? readEnv('VITE_API_URL') ?? readEnv('API_BASE');
  if (apiUrl) return apiUrl.replace(/\/$/, '')

  if (
    typeof window !== 'undefined' &&
    window.location?.origin &&
    !/localhost|127\.0\.0\.1/.test(window.location.origin)
  ) {
    return window.location.origin
  }

  return FALLBACK_API_BASE
}
