import { apiFetch } from './api'

export type HrmRole = 'ADMIN' | 'HR_MANAGER' | 'DEPARTMENT_MANAGER' | 'ACCOUNTANT' | 'EMPLOYEE'

export const HRM_ROLE_LABELS: Record<HrmRole, string> = {
  ADMIN:              'Quản trị hệ thống',
  HR_MANAGER:         'Trưởng phòng Tổ chức',
  DEPARTMENT_MANAGER: 'Trưởng khoa/phòng',
  ACCOUNTANT:         'Kế toán',
  EMPLOYEE:           'Nhân viên',
}

export const HRM_ROLE_COLORS: Record<HrmRole, string> = {
  ADMIN:              'bg-red-100 text-red-700',
  HR_MANAGER:         'bg-purple-100 text-purple-700',
  DEPARTMENT_MANAGER: 'bg-blue-100 text-blue-700',
  ACCOUNTANT:         'bg-yellow-100 text-yellow-700',
  EMPLOYEE:           'bg-gray-100 text-gray-600',
}

export interface RoleAssignment {
  id: string
  employeeCode: string
  fullName: string
  email: string
  departmentName: string | null
  position: string | null
  keycloakUsername: string | null
  hrmRole: HrmRole | null
  status: string
}

export interface RoleAssignmentPage {
  content: RoleAssignment[]
  totalElements: number
  page: number
  size: number
}

export function getRoleAssignments(params: { keyword?: string; page?: number; size?: number }) {
  const q = new URLSearchParams()
  if (params.keyword) q.set('keyword', params.keyword)
  q.set('page', String(params.page ?? 0))
  q.set('size', String(params.size ?? 20))
  return apiFetch<RoleAssignmentPage>(`/admin/role-assignments?${q}`)
}

export function updateRoleAssignment(id: string, role: HrmRole, keycloakUsername: string) {
  return apiFetch<string>(`/admin/role-assignments/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ role, keycloakUsername }),
  })
}
