import { apiFetch } from './api'

export type EmployeeStatus = 'ACTIVE' | 'TERMINATED' | 'PROBATION'
export type ContractType = 'INDEFINITE' | 'FIXED_TERM_1Y' | 'FIXED_TERM_2Y' | 'PART_TIME' | 'PROBATION'
export type Gender = 'MALE' | 'FEMALE' | 'OTHER'

export interface DepartmentSummary {
  id: string
  code: string
  name: string
}

export interface ManagerSummary {
  id: string
  employeeCode: string
  fullName: string
}

export interface Employee {
  id: string
  employeeCode: string
  fullName: string
  email: string
  phone?: string
  gender?: Gender
  dateOfBirth?: string
  joinDate: string
  position?: string
  educationLevel?: string
  ethnicity?: string
  religion?: string
  hometown?: string
  address?: string
  department?: DepartmentSummary
  manager?: ManagerSummary
  contractType: ContractType
  status: EmployeeStatus
  createdAt: string
  updatedAt: string
}

export interface EmployeePage {
  content: Employee[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface EmployeeFormDto {
  employeeCode: string
  fullName: string
  email?: string
  phone?: string
  gender?: Gender
  dateOfBirth?: string
  joinDate: string
  contractType: ContractType
  departmentId?: string
  managerId?: string
  position?: string
  educationLevel?: string
  ethnicity?: string
  religion?: string
  hometown?: string
  address?: string
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

export const GENDER_LABELS: Record<Gender, string> = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
  OTHER: 'Khác',
}

export interface Department {
  id: string
  code: string
  name: string
  parentId: string | null
  children?: Department[]
}

export function getDepartments() {
  return apiFetch<Department[]>('/personnel/departments')
}

export function getDepartmentsTree() {
  return apiFetch<Department[]>('/personnel/departments/tree')
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

export function createEmployee(data: EmployeeFormDto) {
  return apiFetch<Employee>('/personnel/employees', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateEmployee(id: string, data: EmployeeFormDto) {
  return apiFetch<Employee>(`/personnel/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function terminateEmployee(id: string) {
  return apiFetch<void>(`/personnel/employees/${id}/terminate`, { method: 'DELETE' })
}
