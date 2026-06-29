import { apiFetch } from './api'

export interface KpiPeriod {
  id: string; name: string; period_type: string
  start_date: string; end_date: string; status: string
  employee_count?: number; goal_count?: number
}
export interface KpiGoal {
  id: string; title: string; description?: string; category: string
  weight: number; target_value?: number; target_unit?: string
  actual_value?: number; score?: number; status: string
  full_name?: string; employee_code?: string; department_name?: string
}
export interface KpiEvaluation {
  id: string; employee_id: string; full_name: string; employee_code: string
  department_name?: string; total_score?: number; rating?: string
  status: string; submitted_at?: string; approved_at?: string
  self_review?: string; manager_review?: string
  strengths?: string; improvements?: string; goals?: KpiGoal[]
}

export const RATING_LABELS: Record<string, string> = {
  EXCELLENT: 'Xuất sắc',
  GOOD:      'Khá',
  AVERAGE:   'Trung bình',
  BELOW:     'Chưa đạt',
}
export const RATING_COLORS: Record<string, string> = {
  EXCELLENT: 'bg-green-100 text-green-700',
  GOOD:      'bg-blue-100 text-blue-700',
  AVERAGE:   'bg-amber-100 text-amber-700',
  BELOW:     'bg-red-100 text-red-700',
}
export const GOAL_CATEGORIES: Record<string, string> = {
  WORK:       'Công việc chuyên môn',
  DISCIPLINE: 'Kỷ luật & Chuyên cần',
  LEARNING:   'Đào tạo & Phát triển',
  TEAMWORK:   'Làm việc nhóm',
  INNOVATION: 'Sáng kiến & Cải tiến',
}
export const EVAL_STATUS_LABELS: Record<string, string> = {
  SELF_REVIEW: 'Tự đánh giá',
  SUBMITTED:   'Đã nộp',
  APPROVED:    'Đã duyệt',
}

export const getPeriods    = () => apiFetch<KpiPeriod[]>('/kpi/periods')
export const createPeriod  = (body: object) => apiFetch<{ id: string }>('/kpi/periods', { method: 'POST', body: JSON.stringify(body) })
export const getGoals      = (periodId: string, employeeId?: string) =>
  apiFetch<KpiGoal[]>(`/kpi/periods/${periodId}/goals${employeeId ? `?employeeId=${employeeId}` : ''}`)
export const createGoal    = (body: object) => apiFetch<{ id: string }>('/kpi/goals', { method: 'POST', body: JSON.stringify(body) })
export const updateGoalScore = (goalId: string, body: object) =>
  apiFetch<null>(`/kpi/goals/${goalId}/score`, { method: 'PATCH', body: JSON.stringify(body) })
export const getEvaluations = (periodId: string) => apiFetch<KpiEvaluation[]>(`/kpi/periods/${periodId}/evaluations`)
export const getEvaluation  = (periodId: string, employeeId: string) =>
  apiFetch<KpiEvaluation>(`/kpi/periods/${periodId}/evaluations/${employeeId}`)
export const upsertEvaluation = (periodId: string, employeeId: string, body: object) =>
  apiFetch<{ id: string; totalScore: number; rating: string }>(
    `/kpi/periods/${periodId}/evaluations/${employeeId}`, { method: 'POST', body: JSON.stringify(body) })
export const getKpiStats   = (periodId?: string) =>
  apiFetch<Record<string, unknown>>(`/kpi/stats${periodId ? `?periodId=${periodId}` : ''}`)
