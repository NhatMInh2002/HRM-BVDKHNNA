import { apiFetch } from './api'

export interface PermItem { code: string; label: string }
export interface PermGroup { group: string; items: PermItem[] }

export interface EmployeeSummary {
  id: string
  code: string
  fullName: string
  position?: string
  departmentId?: string
  departmentName?: string
  permissions: string[]
}

export interface DeptWithEmployees {
  departmentName: string | null
  employees: EmployeeSummary[]
}

export const getPermissionDefinitions = () =>
  apiFetch<PermGroup[]>('/admin/permissions/definitions')

export const getEmployeesWithPermissions = () =>
  apiFetch<DeptWithEmployees[]>('/admin/permissions/employees')

export const setEmployeePermissions = (employeeId: string, permissions: string[]) =>
  apiFetch<string[]>(`/admin/permissions/employees/${employeeId}`, {
    method: 'PUT',
    body: JSON.stringify(permissions),
  })
