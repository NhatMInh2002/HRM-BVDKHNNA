import { apiFetch } from './api'

export interface AppNotification {
  id: string
  type: 'LEAVE_SUBMITTED' | 'LEAVE_APPROVED' | 'LEAVE_REJECTED' | 'CHECKIN' | 'PAYROLL' | 'SYSTEM'
  title: string
  body?: string
  link?: string
  isRead: boolean
  referenceId?: string
  createdAt: string
}

export const getMyNotifications = () =>
  apiFetch<AppNotification[]>('/notifications/my')

export const getUnreadCount = () =>
  apiFetch<{ unread: number }>('/notifications/unread-count')

export const markNotificationRead = (id: string) =>
  apiFetch<void>(`/notifications/${id}/read`, { method: 'PATCH' })

export const markAllNotificationsRead = () =>
  apiFetch<void>('/notifications/read-all', { method: 'PATCH' })

// Icon and color per type
export const NOTIFICATION_META: Record<string, { icon: string; color: string; bg: string }> = {
  LEAVE_SUBMITTED: { icon: '📋', color: 'text-blue-700',   bg: 'bg-blue-50' },
  LEAVE_APPROVED:  { icon: '✅', color: 'text-green-700',  bg: 'bg-green-50' },
  LEAVE_REJECTED:  { icon: '❌', color: 'text-red-700',    bg: 'bg-red-50' },
  CHECKIN:         { icon: '🕐', color: 'text-purple-700', bg: 'bg-purple-50' },
  PAYROLL:         { icon: '💰', color: 'text-orange-700', bg: 'bg-orange-50' },
  SYSTEM:          { icon: 'ℹ️', color: 'text-gray-700',   bg: 'bg-gray-50' },
}
