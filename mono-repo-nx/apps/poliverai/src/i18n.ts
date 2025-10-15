export function t(key: string, vars?: Record<string, string | number>) {
  // Simple passthrough: return key or a naive interpolation
  if (!vars) return key
  let s = key
  Object.entries(vars).forEach(([k, v]) => {
    s = s.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v))
  })
  return s
}

export default { t }
