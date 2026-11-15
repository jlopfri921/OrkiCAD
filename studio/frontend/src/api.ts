import { invoke } from '@tauri-apps/api/core'

/** Shared Studio transport. The browser uses same-origin /api requests;
 * Tauri uses a private Rust command to contact its loopback worker.
 * API keys are never placed in URLs, storage or command-line arguments.
 */
type DesktopReply = {
  status: number
  contentType: string
  bodyBase64: string
}

function isDesktop(): boolean {
  return typeof window !== 'undefined' &&
    '__TAURI_INTERNALS__' in window
}

function decodeBase64(encoded: string): Uint8Array {
  const binary = atob(encoded)
  const output = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) output[i] = binary.charCodeAt(i)
  return output
}

export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  if (!path.startsWith('/api/') || path.includes('?') || path.includes('#')) {
    throw new Error('Only canonical OrkiCAD API paths are allowed')
  }
  if (!isDesktop()) return fetch(path, options)

  const method = (options?.method || 'GET').toUpperCase()
  if (method !== 'GET' && method !== 'POST') throw new Error('Unsupported API method')
  const body = options?.body
  if (body != null && typeof body !== 'string') {
    throw new Error('Studio API request body must be JSON text')
  }
  const payload = body ? JSON.parse(body) : null
  const result = await invoke<DesktopReply>('studio_request', { path, method, payload })
  const bytes = decodeBase64(result.bodyBase64)
  return new Response(bytes, {
    status: result.status,
    headers: { 'Content-Type': result.contentType },
  })
}
