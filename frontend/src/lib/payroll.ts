import { apiFetch } from './api'

export type PayrollStatus = 'DRAFT' | 'APPROVED' | 'PAID'

export interface SalaryConfig {
  id: string
  employeeId: string
  basicSalary: number
  coefficient: number
  effectiveSalary: number        // basicSalary × coefficient
  allowanceFood: number
  allowanceTransport: number
  allowancePhone: number
  allowancePosition: number      // phụ cấp chức vụ
  allowanceSeniority: number     // phụ cấp thâm niên
  allowanceHouse: number         // phụ cấp nhà ở
  allowanceToxic: number         // phụ cấp độc hại (miễn thuế)
  allowanceOther: number
  totalAllowance: number
  dependents: number             // số người phụ thuộc
  bhxhExempt: boolean
  effectiveFrom: string
  effectiveTo: string | null
}

export interface PayrollRecord {
  id: string
  employeeId: string
  employeeCode?: string
  fullName?: string
  departmentName?: string
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
  coefficient?: number
  allowanceFood?: number
  allowanceTransport?: number
  allowancePhone?: number
  allowancePosition?: number
  allowanceSeniority?: number
  allowanceHouse?: number
  allowanceToxic?: number
  allowanceOther?: number
  dependents?: number
  bhxhExempt?: boolean
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
  return apiFetch<SalaryConfig>('/payroll/salary-config', {
    method: 'POST',
    body: JSON.stringify(dto),
  })
}

export function getSalaryHistory(employeeId: string) {
  return apiFetch<SalaryConfig[]>(`/payroll/salary-config/${employeeId}`)
}

export function getCurrentSalary(employeeId: string) {
  return apiFetch<SalaryConfig>(`/payroll/salary-config/${employeeId}/current`)
}

export function generatePayroll(year: number, month: number) {
  return apiFetch<{ generated: number }>('/payroll/generate', {
    method: 'POST',
    body: JSON.stringify({ year, month }),
  })
}

export function listPayroll(year: number, month: number, page = 0) {
  return apiFetch<PayrollPage>(`/payroll?year=${year}&month=${month}&page=${page}&size=20`)
}

export function approvePayroll(id: string) {
  return apiFetch<PayrollRecord>(`/payroll/${id}/approve`, { method: 'PUT' })
}

export function markPaid(id: string) {
  return apiFetch<PayrollRecord>(`/payroll/${id}/paid`, { method: 'PUT' })
}

export function myPayroll(employeeId: string) {
  return apiFetch<PayrollRecord[]>(`/payroll/my?employeeId=${employeeId}`)
}

export async function downloadPayslipPdf(id: string) {
  const { getSession } = await import('next-auth/react')
  const session = await getSession()
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api'
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

// ── Lương tăng thêm (TNTT) ──────────────────────────────────────────────────

export type QualificationAdjustment = 'NONE' | 'MISSING_LICENSE' | 'BRIDGE_DEGREE'

export interface SalaryIncrementConfig {
  id: string
  employeeId: string
  responsibilityCoefficient: number
  responsibilitySecondaryCoefficient: number
  responsibilityCoefficientTotal: number
  qualificationCoefficient: number
  qualificationAdjustment: QualificationAdjustment
  specialtyMultiplierPercent: number
  qualificationCoefficientAdjusted: number
  concurrentUnionCoefficient: number
  concurrentDeptBonusPercent: number
  concurrentDeptTimePercent: number
  concurrentDeptCoefficient: number
  totalCoefficient: number
  ratingCode: string | null
  ratingPercentage: number
  workdaysActual: number
  workdaysStandard: number
  paymentMultiplier: number
  incrementAmount: number
  effectiveFrom: string
  effectiveTo: string | null
}

export interface SaveSalaryIncrementConfigDto {
  employeeId: string
  responsibilityCoefficient?: number
  responsibilitySecondaryCoefficient?: number
  qualificationCoefficient?: number
  qualificationAdjustment?: QualificationAdjustment
  concurrentUnionCoefficient?: number
  specialtyMultiplierPercent?: number
  concurrentDeptBonusPercent?: number
  concurrentDeptTimePercent?: number
  ratingCode?: string
  ratingPercentage?: number
  workdaysActual?: number
  workdaysStandard?: number
  paymentMultiplier?: number
  effectiveFrom: string
}

export interface CoefficientOption {
  id: number
  label: string
  coefficient: number
}

export interface RatingOption {
  code: string
  label: string
  percentage: number
}

export interface IncrementCoefficientOptions {
  responsibilityOptions: CoefficientOption[]
  qualificationOptions: CoefficientOption[]
  concurrentUnionOptions: CoefficientOption[]
  ratingOptions: RatingOption[]
}

export const QUALIFICATION_ADJUSTMENT_LABELS: Record<QualificationAdjustment, string> = {
  NONE: 'Đủ điều kiện (100%)',
  MISSING_LICENSE: 'Chưa có CCHN (85%)',
  BRIDGE_DEGREE: 'Đại học liên thông (95%)',
}

export function getIncrementCoefficientOptions() {
  return apiFetch<IncrementCoefficientOptions>('/payroll/salary-increment/coefficients')
}

export function saveSalaryIncrementConfig(dto: SaveSalaryIncrementConfigDto) {
  return apiFetch<SalaryIncrementConfig>('/payroll/salary-increment', {
    method: 'POST',
    body: JSON.stringify(dto),
  })
}

export function getSalaryIncrementHistory(employeeId: string) {
  return apiFetch<SalaryIncrementConfig[]>(`/payroll/salary-increment/${employeeId}`)
}

export function getCurrentSalaryIncrement(employeeId: string) {
  return apiFetch<SalaryIncrementConfig>(`/payroll/salary-increment/${employeeId}/current`)
}

export async function exportPayrollExcel(year: number, month: number) {
  const { getSession } = await import('next-auth/react')
  const session = await getSession()
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api'
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
