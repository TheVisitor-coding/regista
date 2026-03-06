import type { ApiError } from '@regista/shared'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

let accessToken: string | null = null
let refreshPromise: Promise<string | null> | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public body: ApiError,
  ) {
    super(body.message || body.error)
    this.name = 'ApiRequestError'
  }
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!res.ok) return null
    const data = await res.json()
    accessToken = data.accessToken
    return accessToken
  } catch {
    return null
  }
}

export async function apiClient<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers)

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (res.status === 401 && !path.startsWith('/auth/refresh')) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null
      })
    }

    const newToken = await refreshPromise
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`)
      const retryRes = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
        credentials: 'include',
      })

      if (!retryRes.ok) {
        const body = await retryRes.json().catch(() => ({ error: 'Request failed' }))
        throw new ApiRequestError(retryRes.status, body)
      }
      return retryRes.json() as Promise<T>
    }

    const body = await res.json().catch(() => ({ error: 'Unauthorized' }))
    throw new ApiRequestError(401, body)
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new ApiRequestError(res.status, body)
  }

  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}
