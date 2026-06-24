import { apiFetch } from './api'

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'LEAVE'
export type LeaveType = 'ANNUAL' | 'SICK' | 'MATERNITY' | 'UNPAID' | 'OTHER'
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface AttendanceRecord {
  id: string
  employeeId: string
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
  leaveType: LeaveType
  startDate: string
  endDate: string
  totalDays: number
  reason?: string
  status: LeaveStatus
  approvedBy?: string
  approvedAt?: string
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
}

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: 'Có mặt', ABSENT: 'Vắng', LATE: 'Đi muộn', HALF_DAY: 'Nửa ngày', LEAVE: 'Nghỉ phép',
}
export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  ANNUAL: 'Nghỉ phép năm', SICK: 'Nghỉ ốm', MATERNITY: 'Thai sản', UNPAID: 'Không lương', OTHER: 'Khác',
}
export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối',
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

export const getPendingLeaveRequests = () =>
  apiFetch<LeaveRequest[]>('/attendance/leave/pending')

export const approveLeave = (id: string) =>
  apiFetch<LeaveRequest>(`/attendance/leave/${id}/approve`, { method: 'PUT' })

export const rejectLeave = (id: string) =>
  apiFetch<LeaveRequest>(`/attendance/leave/${id}/reject`, { method: 'PUT' })
