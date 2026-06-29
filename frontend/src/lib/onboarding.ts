import { apiFetch } from './api'

export interface OnboardingTemplate {
  id: string; name: string; description?: string; task_count: number
}
export interface OnboardingTask {
  id: string; title: string; description?: string; category: string
  due_date?: string; status: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'SKIPPED'
  completed_at?: string; notes?: string; sort_order: number; is_required: boolean
}
export interface OnboardingChecklist {
  id: string; employee_id: string; full_name: string; employee_code: string
  department_name?: string; start_date: string; status: string
  total_tasks?: number; done_tasks?: number; tasks?: OnboardingTask[]
}

export const CATEGORY_LABELS: Record<string, string> = {
  DOCUMENTS:   'Hồ sơ / Giấy tờ',
  INSURANCE:   'Bảo hiểm',
  SYSTEM:      'Hệ thống / Tài khoản',
  HEALTH:      'Sức khỏe',
  TRAINING:    'Đào tạo',
  EQUIPMENT:   'Trang thiết bị',
  ORIENTATION: 'Hướng dẫn',
  FINANCE:     'Tài chính',
  GENERAL:     'Khác',
}

export const CATEGORY_COLORS: Record<string, string> = {
  DOCUMENTS:   'bg-blue-100 text-blue-700',
  INSURANCE:   'bg-purple-100 text-purple-700',
  SYSTEM:      'bg-cyan-100 text-cyan-700',
  HEALTH:      'bg-red-100 text-red-700',
  TRAINING:    'bg-amber-100 text-amber-700',
  EQUIPMENT:   'bg-gray-100 text-gray-700',
  ORIENTATION: 'bg-green-100 text-green-700',
  FINANCE:     'bg-emerald-100 text-emerald-700',
  GENERAL:     'bg-slate-100 text-slate-700',
}

export const getTemplates = () => apiFetch<OnboardingTemplate[]>('/onboarding/templates')
export const getChecklists = (employeeId?: string) => apiFetch<OnboardingChecklist[]>(
  '/onboarding/checklists' + (employeeId ? `?employeeId=${employeeId}` : ''))
export const getChecklist = (id: string) => apiFetch<OnboardingChecklist>(`/onboarding/checklists/${id}`)
export const createChecklist = (body: { employeeId: string; templateId: string; startDate?: string }) =>
  apiFetch<{ id: string }>('/onboarding/checklists', { method: 'POST', body: JSON.stringify(body) })
export const updateTaskStatus = (taskId: string, status: string, notes?: string) =>
  apiFetch<null>(`/onboarding/tasks/${taskId}/status?status=${status}${notes ? `&notes=${encodeURIComponent(notes)}` : ''}`, { method: 'PATCH' })
export const getOnboardingStats = () => apiFetch<Record<string, unknown>>('/onboarding/stats')
