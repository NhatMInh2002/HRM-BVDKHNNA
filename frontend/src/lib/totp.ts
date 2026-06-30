import { apiFetch } from './api'

export interface TotpSetupResponse {
  secret: string
  qrCodeUri: string
}

// /auth/* trùng namespace NextAuth — dùng rewrite /api/auth-backend/* → backend /api/auth/*
export const getTotpStatus  = () => apiFetch<{ enabled: boolean }>('/auth-backend/2fa/status')
export const setupTotp      = () => apiFetch<TotpSetupResponse>('/auth-backend/2fa/setup', { method: 'POST' })
export const confirmTotp    = (code: string) =>
  apiFetch<null>('/auth-backend/2fa/confirm', { method: 'POST', body: JSON.stringify({ code }) })
export const disableTotp    = (password: string) =>
  apiFetch<null>('/auth-backend/2fa/disable', { method: 'POST', body: JSON.stringify({ password }) })
