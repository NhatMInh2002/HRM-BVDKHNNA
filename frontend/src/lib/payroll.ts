import { apiFetch } from './api'

export type PayrollStatus = 'DRAFT' | 'APPROVED' | 'PAID'

export interface SalaryConfig {
  id: string
  employeeId: string
  basicSalary: number
  allowanceFood: number
  allowanceTransport: number
  allowancePhone: number
  allowanceOther: number
  coefficient: number
  totalAllowance: number
  effectiveFrom: string
  effectiveTo: string | null
}

export interface PayrollRecord {
  id: string
  employeeId: string
  periodYear: number
  periodMonth: number
  basicSalary: number
  totalAllowance: number
  otPay: number
  grossSalary: number
  bhxhEmployee: number
  bhytEmployee: number
  bhtnEmployee: number
  pit: number
  otherDeduction: number
  totalDeduction: number
  netSalary: number
  workingDays: number
  actualDays: number
  otHours: number
  status: PayrollStatus
  note: string | null
  approvedBy: string | null
  approvedAt: string | null
  createdAt: string
}

export interface PayrollPage {
  content: PayrollRecord[]
  totalElements: number
  totalPages: number
  number: number
}

export interface SaveSalaryConfigDto {
  employeeId: string
  basicSalary: number
  allowanceFood?: number
  allowanceTransport?: number
  allowancePhone?: number
  allowanceOther?: number
  coefficient?: number
  effectiveFrom: string
}

export const PAYROLL_STATUS_LABELS: Record<PayrollStatus, string> = {
  DRAFT: 'Nháp',
  APPROVED: 'Đã duyệt',
  PAID: 'Đã trả',
}

export const PAYROLL_STATUS_COLORS: Record<PayrollStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  APPROVED: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
}

export function saveSalaryConfig(dto: SaveSalaryConfigDto) {
  return apiFetch<{ data: SalaryConfig }>('/payroll/salary-config', {
    method: 'POST',
    body: JSON.stringify(dto),
  }).then(r => r.data)
}

export function getSalaryHistory(employeeId: string) {
  return apiFetch<{ data: SalaryConfig[] }>(`/payroll/salary-config/${employeeId}`)
    .then(r => r.data)
}

export function getCurrentSalary(employeeId: string) {
  return apiFetch<{ data: SalaryConfig }>(`/payroll/salary-config/${employeeId}/current`)
    .then(r => r.data)
}

export function generatePayroll(year: number, month: number) {
  return apiFetch<{ data: { generated: number } }>('/payroll/generate', {
    method: 'POST',
    body: JSON.stringify({ year, month }),
  }).then(r => r.data)
}

export function listPayroll(year: number, month: number, page = 0) {
  return apiFetch<{ data: PayrollPage }>(`/payroll?year=${year}&month=${month}&page=${page}&size=20`)
    .then(r => r.data)
}

export function approvePayroll(id: string) {
  return apiFetch<{ data: PayrollRecord }>(`/payroll/${id}/approve`, { method: 'PUT' })
    .then(r => r.data)
}

export function markPaid(id: string) {
  return apiFetch<{ data: PayrollRecord }>(`/payroll/${id}/paid`, { method: 'PUT' })
    .then(r => r.data)
}

export function myPayroll(employeeId: string) {
  return apiFetch<{ data: PayrollRecord[] }>(`/payroll/my?employeeId=${employeeId}`)
    .then(r => r.data)
}

export async function downloadPayslipPdf(id: string) {
  const { getSession } = await import('next-auth/react')
  const session = await getSession()
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api'
  const res = await fetch(`${base}/payroll/${id}/payslip.pdf`, {
    headers: { Authorization: `Bearer ${(session as any)?.accessToken ?? ''}` },
  })
  if (!res.ok) throw new Error('Không thể tải phiếu lương')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `phieu-luong-${id.slice(0, 8)}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportPayrollExcel(year: number, month: number) {
  const { getSession } = await import('next-auth/react')
  const session = await getSession()
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api'
  const res = await fetch(`${base}/payroll/export.xlsx?year=${year}&month=${month}`, {
    headers: { Authorization: `Bearer ${(session as any)?.accessToken ?? ''}` },
  })
  if (!res.ok) throw new Error('Không thể xuất Excel')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bang-luong-${month}-${year}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
