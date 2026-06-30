import { apiFetch } from './api'

export interface AuditLogEntry {
  id: number
  actor_id?: string
  actor_name?: string
  actor_role?: string
  action: string
  entity_type: string
  entity_id?: string
  before_data?: Record<string, unknown>
  after_data?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  created_at: string
}

export const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Tạo mới',
  UPDATE: 'Cập nhật',
  DELETE: 'Xóa',
  APPROVE: 'Phê duyệt',
  REJECT: 'Từ chối',
  LOGIN: 'Đăng nhập',
  EXPORT: 'Xuất dữ liệu',
}

export const ACTION_COLORS: Record<string, string> = {
  CREATE:  'bg-green-100 text-green-700',
  UPDATE:  'bg-blue-100 text-blue-700',
  DELETE:  'bg-red-100 text-red-700',
  APPROVE: 'bg-emerald-100 text-emerald-700',
  REJECT:  'bg-amber-100 text-amber-700',
  LOGIN:   'bg-purple-100 text-purple-700',
  EXPORT:  'bg-cyan-100 text-cyan-700',
}

export const getAuditLog = (params?: { entityType?: string; entityId?: string; action?: string; limit?: number }) => {
  const q = new URLSearchParams()
  if (params?.entityType) q.set('entityType', params.entityType)
  if (params?.entityId)   q.set('entityId', params.entityId)
  if (params?.action)     q.set('action', params.action)
  if (params?.limit)      q.set('limit', String(params.limit))
  const qs = q.toString()
  return apiFetch<AuditLogEntry[]>('/audit-log' + (qs ? `?${qs}` : ''))
}

export const getEntityTypes = () => apiFetch<string[]>('/audit-log/entity-types')
