// Copied from frontend/src/lib/authHelpers.ts — simplified for RN environment
export function extractTokenFromResponse(resp: any): string | null {
  try {
    if (!resp) return null
    if (typeof resp === 'string') return resp
    if (resp.token) return String(resp.token)
    if (resp.access_token) return String(resp.access_token)
  } catch {
    // ignore
  }
  return null
}

export function getAuthHeader(token?: string | null): Record<string, string> {
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}
