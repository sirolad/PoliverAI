export function buildApiUrl(path: string) {
  // TODO: Implement getApiBaseOrigin for Nx
  const base = '';
  return `${base}${path}`;
}

export async function downloadFileFromApi(path: string, filename: string, token?: string | null) {
  const url = buildApiUrl(path);
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // React Native: Use RNFS or similar for file download
  // This is a stub for integration
}
