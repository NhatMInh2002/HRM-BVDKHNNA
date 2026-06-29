import { apiFetch } from './api'

export const CONTRACT_TYPE_LABELS: Record<string, string> = {
  INDEFINITE:    'Không xác định thời hạn',
  FIXED_TERM_1Y: 'Xác định thời hạn 1 năm',
  FIXED_TERM_2Y: 'Xác định thời hạn 2 năm',
  PROBATION:     'Thử việc',
  PART_TIME:     'Bán thời gian',
}

export const CONTRACT_STATUS_LABELS: Record<string, string> = {
  DRAFT:       'Bản nháp',
  ACTIVE:      'Hiệu lực',
  EXPIRED:     'Hết hạn',
  TERMINATED:  'Thanh lý',
}

export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED'

export interface Contract {
  id: string
  employeeId: string
  employeeName: string
  employeeCode: string
  contractNumber: string
  contractType: string
  status: ContractStatus
  startDate: string
  endDate?: string
  signDate: string
  signerName?: string
  position?: string
  departmentName?: string
  baseSalary?: number
  salaryGrade?: string
  salaryCoefficient?: number
  allowancePosition?: number
  allowanceSeniority?: number
  allowanceOther?: number
  totalSalary?: number
  attachmentUrl?: string
  attachmentName?: string
  notes?: string
  createdBy: string
  createdAt: string
}

export interface CreateContractDto {
  employeeId: string
  contractNumber: string
  contractType: string
  startDate: string
  endDate?: string
  signDate: string
  signerName?: string
  position?: string
  departmentName?: string
  baseSalary?: number
  salaryGrade?: string
  salaryCoefficient?: number
  allowancePosition?: number
  allowanceSeniority?: number
  allowanceOther?: number
  attachmentUrl?: string
  attachmentName?: string
  notes?: string
}

export const getEmployeeContracts = (employeeId: string) =>
  apiFetch<Contract[]>(`/api/personnel/contracts/employee/${employeeId}`)

export const getExpiringSoon = (days = 30) =>
  apiFetch<Contract[]>(`/api/personnel/contracts/expiring-soon?days=${days}`)

export const createContract = (dto: CreateContractDto) =>
  apiFetch<Contract>('/api/personnel/contracts', { method: 'POST', body: JSON.stringify(dto) })

export const updateContract = (id: string, dto: CreateContractDto) =>
  apiFetch<Contract>(`/api/personnel/contracts/${id}`, { method: 'PUT', body: JSON.stringify(dto) })

export const updateContractStatus = (id: string, status: string) =>
  apiFetch<Contract>(`/api/personnel/contracts/${id}/status?status=${status}`, { method: 'PATCH' })
