import { apiFetch } from './api'

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'LEAVE'
export type LeaveType =
  | 'ANNUAL'
  | 'PERSONAL_MARRIAGE'
  | 'PERSONAL_CHILD_MARRIAGE'
  | 'BEREAVEMENT_LEVEL1'
  | 'BEREAVEMENT_LEVEL2'
  | 'SICK'
  | 'MATERNITY'
  | 'PATERNITY'
  | 'COMPENSATORY'
  | 'UNPAID'
  | 'OTHER'
export type LeaveStatus = 'PENDING' | 'DEPT_APPROVED' | 'APPROVED' | 'REJECTED'

export interface LeaveTypeMeta {
  label: string
  group: string
  maxDays?: number        // số ngày tối đa theo quy định (undefined = không giới hạn cứng)
  paid: boolean
  requiresDoc?: string    // loại giấy tờ cần nộp
}

export const LEAVE_TYPE_META: Record<LeaveType, LeaveTypeMeta> = {
  ANNUAL: {
    label: 'Nghỉ phép năm',
    group: 'Phép năm',
    paid: true,
  },
  PERSONAL_MARRIAGE: {
    label: 'Bản thân kết hôn',
    group: 'Việc riêng có lương',
    maxDays: 3,
    paid: true,
    requiresDoc: 'Giấy đăng ký kết hôn',
  },
  PERSONAL_CHILD_MARRIAGE: {
    label: 'Con kết hôn',
    group: 'Việc riêng có lương',
    maxDays: 1,
    paid: true,
    requiresDoc: 'Giấy đăng ký kết hôn của con',
  },
  BEREAVEMENT_LEVEL1: {
    label: 'Tang chế — bố/mẹ/vợ/chồng/con',
    group: 'Việc riêng có lương',
    maxDays: 3,
    paid: true,
    requiresDoc: 'Giấy báo tử / giấy chứng tử',
  },
  BEREAVEMENT_LEVEL2: {
    label: 'Tang chế — ông/bà/anh/chị/em',
    group: 'Việc riêng có lương',
    maxDays: 1,
    paid: true,
    requiresDoc: 'Giấy báo tử / giấy chứng tử',
  },
  SICK: {
    label: 'Nghỉ ốm (BHXH)',
    group: 'Nghỉ ốm',
    paid: true,
    requiresDoc: 'Giấy chứng nhận nghỉ việc hưởng BHXH (mẫu C65-HD)',
  },
  MATERNITY: {
    label: 'Nghỉ thai sản (lao động nữ)',
    group: 'Thai sản',
    maxDays: 180,
    paid: true,
    requiresDoc: 'Giấy chứng sinh / giấy siêu âm',
  },
  PATERNITY: {
    label: 'Nghỉ khi vợ sinh (lao động nam)',
    group: 'Thai sản',
    maxDays: 14,
    paid: true,
    requiresDoc: 'Giấy chứng sinh',
  },
  COMPENSATORY: {
    label: 'Nghỉ bù',
    group: 'Nghỉ bù',
    paid: true,
  },
  UNPAID: {
    label: 'Nghỉ không lương',
    group: 'Không lương',
    paid: false,
  },
  OTHER: {
    label: 'Khác',
    group: 'Khác',
    paid: false,
  },
}

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = Object.fromEntries(
  Object.entries(LEAVE_TYPE_META).map(([k, v]) => [k, v.label])
) as Record<LeaveType, string>

// Nhóm các loại nghỉ theo group để hiển thị trong dropdown
export const LEAVE_TYPE_GROUPS: { group: string; types: LeaveType[] }[] = [
  {
    group: 'Phép năm',
    types: ['ANNUAL'],
  },
  {
    group: 'Việc riêng có lương (Điều 115 BLLĐ 2019)',
    types: ['PERSONAL_MARRIAGE', 'PERSONAL_CHILD_MARRIAGE', 'BEREAVEMENT_LEVEL1', 'BEREAVEMENT_LEVEL2'],
  },
  {
    group: 'Nghỉ ốm',
    types: ['SICK'],
  },
  {
    group: 'Thai sản',
    types: ['MATERNITY', 'PATERNITY'],
  },
  {
    group: 'Khác',
    types: ['COMPENSATORY', 'UNPAID', 'OTHER'],
  },
]

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  PENDING: 'Chờ trưởng phòng', DEPT_APPROVED: 'Chờ TCCB', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối',
}

export interface AttendanceRecord {
  id: string
  employeeId: string
  employeeCode?: string
  fullName?: string
  workDate: string
  checkIn?: string
  checkOut?: string
  status: AttendanceStatus
  note?: string
  durationMinutes?: number
}

export interface AttendancePage {
  content: AttendanceRecord[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface LeaveRequest {
  id: string
  employeeId: string
  employeeName?: string
  employeeCode?: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  totalDays: number
  reason?: string
  attachmentUrl?: string
  attachmentName?: string
  status: LeaveStatus
  // Cấp 1: Trưởng phòng
  deptApprovedBy?: string
  deptApprovedAt?: string
  deptRejectedBy?: string
  deptRejectNote?: string
  // Cấp 2: TCCB
  hrApprovedBy?: string
  hrApprovedAt?: string
  hrRejectedBy?: string
  hrRejectNote?: string
  // PDF kết quả
  pdfUrl?: string
  createdBy: string
  createdAt: string
}

export interface CheckInDto { employeeId: string; note?: string }
export interface CheckOutDto { employeeId: string }
export interface CreateLeaveDto {
  employeeId: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  reason?: string
  attachmentUrl?: string
  attachmentName?: string
}

export const checkIn = (data: CheckInDto) =>
  apiFetch<AttendanceRecord>('/attendance/check-in', { method: 'POST', body: JSON.stringify(data) })

export const checkOut = (data: CheckOutDto) =>
  apiFetch<AttendanceRecord>('/attendance/check-out', { method: 'POST', body: JSON.stringify(data) })

export const getDailyAttendance = (date: string, page = 0) =>
  apiFetch<AttendancePage>(`/attendance/daily?date=${date}&page=${page}&size=30`)

export const getMonthlyReport = (employeeId: string, year: number, month: number) =>
  apiFetch<AttendanceRecord[]>(`/attendance/monthly/${employeeId}?year=${year}&month=${month}`)

export const createLeaveRequest = (data: CreateLeaveDto) =>
  apiFetch<LeaveRequest>('/attendance/leave', { method: 'POST', body: JSON.stringify(data) })

export const getMyLeaveRequests = (employeeId: string) =>
  apiFetch<LeaveRequest[]>(`/attendance/leave/my?employeeId=${employeeId}`)

// Luồng duyệt 2 cấp — trưởng khoa/phòng rồi TCCB (khớp quy trình "Giấy xin phép" trên iOffice)
export const getDeptPendingLeave = () =>
  apiFetch<LeaveRequest[]>('/attendance/leave/dept-pending')

export const getHrPendingLeave = () =>
  apiFetch<LeaveRequest[]>('/attendance/leave/hr-pending')

export const deptApproveLeave = (id: string) =>
  apiFetch<LeaveRequest>(`/attendance/leave/${id}/dept-approve`, { method: 'POST' })

export const deptRejectLeave = (id: string, note?: string) =>
  apiFetch<LeaveRequest>(`/attendance/leave/${id}/dept-reject`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  })

export const hrApproveLeave = (id: string) =>
  apiFetch<LeaveRequest>(`/attendance/leave/${id}/hr-approve`, { method: 'POST' })

export const hrRejectLeave = (id: string, note?: string) =>
  apiFetch<LeaveRequest>(`/attendance/leave/${id}/hr-reject`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  })
