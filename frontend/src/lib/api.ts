import { getSession } from 'next-auth/react'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api'

async function getToken(): Promise<string | undefined> {
  if (typeof window === 'undefined') {
    const session = await getServerSession(authOptions)
    return session?.accessToken
  }
  const session = await getSession()
  return session?.accessToken
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (res.status === 204) return undefined as T

  const json = await res.json().catch(() => ({ message: res.statusText }))

  if (!res.ok) {
    throw new Error(json.message ?? `HTTP ${res.status}`)
  }

  // Unwrap ApiResponse<T> wrapper: { success, data, message }
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    if (!json.success) throw new Error(json.message ?? 'API error')
    return json.data as T
  }

  return json as T
}
