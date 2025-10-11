import en from './locales/en'

type Locale = typeof en

let current: Locale = en

export function setLocale(l: Locale) { current = l }

export function t(path: string, vars?: Record<string, string | number>) {
  const parts = path.split('.')
  let cur: unknown = current
  for (const p of parts) {
  if (!cur || typeof cur !== 'object') return path
  // @ts-expect-error - index access on unknown object
  cur = cur[p]
  }
  if (typeof cur !== 'string') return path
  if (!vars) return cur
  return cur.replace(/\{([^}]+)\}/g, (_, k) => String(vars[k] ?? ''))
}

export default { t, setLocale }
