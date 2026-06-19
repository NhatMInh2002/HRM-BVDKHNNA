import { apiFetch } from './api'

export type EmployeeStatus = 'ACTIVE' | 'TERMINATED' | 'PROBATION'
export type ContractType = 'INDEFINITE' | 'FIXED_TERM_1Y' | 'FIXED_TERM_2Y' | 'PART_TIME' | 'PROBATION'

export interface Employee {
  id: string
  employeeCode: string
  fullName: string
  email: string
  phone?: string
  position?: string
  departmentId?: string
  departmentName?: string
  contractType: ContractType
  startDate: string
  endDate?: string
  status: EmployeeStatus
  createdAt: string
}

export interface EmployeePage {
  content: Employee[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface CreateEmployeeDto {
  employeeCode: string
  fullName: string
  email: string
  phone?: string
  position?: string
  departmentId?: string
  contractType: ContractType
  startDate: string
  endDate?: string
}

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  INDEFINITE: 'Không xác định thời hạn',
  FIXED_TERM_1Y: 'Xác định thời hạn 1 năm',
  FIXED_TERM_2Y: 'Xác định thời hạn 2 năm',
  PART_TIME: 'Bán thời gian',
  PROBATION: 'Thử việc',
}

export const STATUS_LABELS: Record<EmployeeStatus, string> = {
  ACTIVE: 'Đang làm việc',
  TERMINATED: 'Đã nghỉ việc',
  PROBATION: 'Thử việc',
}

export function searchEmployees(params: {
  keyword?: string
  status?: EmployeeStatus | ''
  departmentId?: string
  page?: number
  size?: number
}) {
  const q = new URLSearchParams()
  if (params.keyword) q.set('keyword', params.keyword)
  if (params.status) q.set('status', params.status)
  if (params.departmentId) q.set('departmentId', params.departmentId)
  q.set('page', String(params.page ?? 0))
  q.set('size', String(params.size ?? 20))
  return apiFetch<EmployeePage>(`/personnel/employees?${q}`)
}

export function getEmployee(id: string) {
  return apiFetch<Employee>(`/personnel/employees/${id}`)
}

export function createEmployee(data: CreateEmployeeDto) {
  return apiFetch<Employee>('/personnel/employees', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateEmployee(id: string, data: Partial<CreateEmployeeDto>) {
  return apiFetch<Employee>(`/personnel/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function terminateEmployee(id: string) {
  return apiFetch<void>(`/personnel/employees/${id}/terminate`, { method: 'DELETE' })
}
