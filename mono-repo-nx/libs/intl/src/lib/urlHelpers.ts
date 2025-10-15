export function buildUrl(path: string, params?: Record<string, string | number | null | undefined>) {
  if (!params) return path;
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  if (!parts.length) return path;
  return `${path}?${parts.join('&')}`;
}
