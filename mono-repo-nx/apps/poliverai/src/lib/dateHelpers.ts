export function toIso(d: Date | string | null | undefined): string {
  if (!d) return ''
  if (typeof d === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d
    const parsed = new Date(d)
    if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10)
    return ''
  }
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return ''
}
