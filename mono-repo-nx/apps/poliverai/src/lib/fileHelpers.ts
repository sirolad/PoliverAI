import { getApiBaseOrigin } from './paymentsHelpers'

export function buildApiUrl(path: string) {
  const base = getApiBaseOrigin()
  return `${base ?? 'http://localhost:8000'}${path}`
}

export async function downloadFileFromApi(path: string, filename: string, token?: string | null) {
  // RN implementation should use react-native-fs or Expo FileSystem. Placeholder for now.
  const url = buildApiUrl(path)
  console.warn('downloadFileFromApi not implemented for RN. URL:', url)
  throw new Error('downloadFileFromApi not implemented for RN')
}
