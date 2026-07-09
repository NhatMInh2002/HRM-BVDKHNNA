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
  avatarUrl?: string
  signatureUrl?: string
  hrmRole?: string
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
  managerId?: string | null
  managerName?: string | null
  managerPhone?: string | null
  contactPhone?: string | null
  dutyPhone?: string | null
  children?: Department[]
}

export function getDepartments() {
  return apiFetch<Department[]>('/personnel/departments')
}

export function getDepartmentsTree() {
  return apiFetch<Department[]>('/personnel/departments/tree')
}

export function updateDepartmentContact(
  id: string,
  body: { managerId?: string | null; contactPhone?: string | null; dutyPhone?: string | null }
) {
  return apiFetch<Department>(`/personnel/departments/${id}/contact`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
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

export async function exportEmployeesExcel(params: {
  keyword?: string
  status?: EmployeeStatus | ''
  departmentId?: string
}) {
  const { getSession } = await import('next-auth/react')
  const session = await getSession()
  const q = new URLSearchParams()
  if (params.keyword) q.set('keyword', params.keyword)
  if (params.status) q.set('status', params.status)
  if (params.departmentId) q.set('departmentId', params.departmentId)
  const res = await fetch(`/api/personnel/employees/export.xlsx?${q}`, {
    headers: { Authorization: `Bearer ${(session as any)?.accessToken ?? ''}` },
  })
  if (!res.ok) throw new Error('Không thể xuất Excel')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'danh-sach-nhan-vien.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}

// ── Kiêm nhiệm khoa/phòng khác ───────────────────────────────────────────────

export type ConcurrentRoleType = 'BS_DS' | 'DD_KTV'

export interface EmployeeConcurrentAssignment {
  id: string
  employeeId: string
  departmentId: string
  departmentName: string
  roleType: ConcurrentRoleType
  bonusPercent: number     // 10 (BS_DS) hoặc 5 (DD_KTV)
  timePercent: number
  decisionNumber?: string
  effectiveFrom: string
  effectiveTo: string | null
  note?: string
}

export interface SaveConcurrentAssignmentDto {
  employeeId: string
  departmentId: string
  roleType: ConcurrentRoleType
  timePercent: number
  decisionNumber?: string
  effectiveFrom: string
  effectiveTo?: string
  note?: string
}

export const CONCURRENT_ROLE_LABELS: Record<ConcurrentRoleType, string> = {
  BS_DS: 'Bác sĩ / Dược sĩ (+10%)',
  DD_KTV: 'Điều dưỡng / KTV (+5%)',
}

export function getConcurrentAssignments(employeeId: string) {
  return apiFetch<EmployeeConcurrentAssignment[]>(`/personnel/concurrent-assignments/employee/${employeeId}`)
}

export function getCurrentConcurrentAssignment(employeeId: string) {
  return apiFetch<EmployeeConcurrentAssignment | null>(`/personnel/concurrent-assignments/employee/${employeeId}/current`)
}

export function createConcurrentAssignment(dto: SaveConcurrentAssignmentDto) {
  return apiFetch<EmployeeConcurrentAssignment>('/personnel/concurrent-assignments', {
    method: 'POST',
    body: JSON.stringify(dto),
  })
}

export function endConcurrentAssignment(id: string) {
  return apiFetch<void>(`/personnel/concurrent-assignments/${id}/end`, { method: 'PATCH' })
}

// ── Hồ sơ nhân viên (upload TCCB) + gợi ý OCR ────────────────────────────────

export type DocumentType =
  | 'APPOINTMENT_DECISION' | 'DEGREE_CERTIFICATE' | 'PRACTICE_LICENSE'
  | 'CONCURRENT_DECISION' | 'LABOR_CONTRACT' | 'MERIT_RATING' | 'TIMESHEET'

export type OcrStatus = 'PENDING' | 'DONE' | 'FAILED' | 'SKIPPED'

export interface EmployeeDocument {
  id: string
  employeeId: string
  docType: DocumentType
  fileUrl: string
  fileName?: string
  ocrStatus: OcrStatus
  extractedText?: string
  matchedLabel?: string
  matchedCoefficient?: number
  matchedDepartmentId?: string
  matchedRoleType?: 'BS_DS' | 'DD_KTV'
  matchedTimePercent?: number
  matchConfidence?: 'HIGH' | 'LOW'
  verified: boolean
  uploadedBy: string
  createdAt: string
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  APPOINTMENT_DECISION: 'Quyết định bổ nhiệm/phân công chức vụ',
  DEGREE_CERTIFICATE: 'Bằng cấp / học hàm-vị',
  PRACTICE_LICENSE: 'Chứng chỉ hành nghề (CCHN)',
  CONCURRENT_DECISION: 'Quyết định kiêm nhiệm/điều động',
  LABOR_CONTRACT: 'Hợp đồng làm việc/lao động',
  MERIT_RATING: 'Kết quả xếp loại thi đua',
  TIMESHEET: 'Bảng chấm công',
}

export async function uploadRawFile(file: File, folder: string) {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('folder', folder)
  return apiFetch<{ url: string; name: string }>('/files/upload', { method: 'POST', body: fd })
}

export function registerEmployeeDocument(dto: { employeeId: string; docType: DocumentType; fileUrl: string; fileName?: string }) {
  return apiFetch<EmployeeDocument>('/personnel/employee-documents', {
    method: 'POST',
    body: JSON.stringify(dto),
  })
}

export function getEmployeeDocuments(employeeId: string) {
  return apiFetch<EmployeeDocument[]>(`/personnel/employee-documents/employee/${employeeId}`)
}

export function verifyEmployeeDocument(id: string) {
  return apiFetch<EmployeeDocument>(`/personnel/employee-documents/${id}/verify`, { method: 'PATCH' })
}

// ── Hồ sơ lý lịch HS02-VC/BNV ───────────────────────────────────────────────

export interface WorkHistoryItem {
  fromDate: string | null; toDate: string | null
  unit: string; position: string | null; note: string | null
}
export interface TrainingItem {
  fromDate: string | null; toDate: string | null; institution: string
  field: string | null; form: string | null; degree: string | null
}
export interface FamilyRelationItem {
  side: 'SELF' | 'SPOUSE'; relation: string; fullName: string
  birthYear: number | null; detail: string | null
}
export interface AwardItem {
  type: 'AWARD' | 'DISCIPLINE'; year: number | null
  title: string; decisionNo: string | null; level: string | null
}

export interface EmployeeProfile {
  birthPlace: string | null
  nationalIdIssueDate: string | null
  nationalIdIssuePlace: string | null
  socialInsuranceNo: string | null
  healthInsuranceNo: string | null
  familyOrigin: string | null
  jobBeforeRecruitment: string | null
  recruitmentDate: string | null
  recruitmentAgency: string | null
  ngachCode: string | null
  salaryGrade: number | null
  salaryCoefficient: number | null
  salaryEffectiveDate: string | null
  educationGeneral: string | null
  professionalDegree: string | null
  politicalTheory: string | null
  stateManagement: string | null
  foreignLanguage: string | null
  informaticsLevel: string | null
  partyJoinDate: string | null
  partyOfficialDate: string | null
  youthUnionJoinDate: string | null
  militaryServiceFrom: string | null
  militaryServiceTo: string | null
  warInvalidClass: string | null
  policyFamilyType: string | null
  healthStatus: string | null
  heightCm: number | null
  weightKg: number | null
  bloodType: string | null
  personalHistory: string | null
  familyEconomy: string | null
  workHistory: WorkHistoryItem[]
  trainings: TrainingItem[]
  familyRelations: FamilyRelationItem[]
  awards: AwardItem[]
}

export function getEmployeeProfile(employeeId: string) {
  return apiFetch<EmployeeProfile>(`/personnel/employees/${employeeId}/profile`)
}

export function saveEmployeeProfile(employeeId: string, dto: EmployeeProfile) {
  return apiFetch<EmployeeProfile>(`/personnel/employees/${employeeId}/profile`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  })
}

export async function downloadProfilePdf(employeeId: string, employeeName: string) {
  const { getSession } = await import('next-auth/react')
  const session = await getSession()
  const res = await fetch(`/api/personnel/employees/${employeeId}/profile/pdf`, {
    headers: { Authorization: `Bearer ${(session as any)?.accessToken ?? ''}` },
  })
  if (!res.ok) throw new Error('Không thể tải sơ yếu lý lịch')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `so-yeu-ly-lich-${employeeName.replace(/\s+/g, '-')}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
