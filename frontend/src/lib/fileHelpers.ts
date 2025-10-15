import { getApiBaseOrigin } from './paymentsHelpers'

export function buildApiUrl(path: string) {
  const base = getApiBaseOrigin()
  return `${base ?? 'http://localhost:8000'}${path}`
}

export async function downloadFileFromApi(path: string, filename: string, token?: string | null) {
  const url = buildApiUrl(path)
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(url, { method: 'GET', headers })
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`)
  }
  const blob = await response.blob()
  const blobUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(blobUrl)
}
