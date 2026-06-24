import { apiFetch } from './api'

export interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  probationEmployees: number
  onLeaveEmployees: number
  terminatedEmployees: number
  totalDepartments: number
}

export interface AttendanceDayEntry {
  date: string
  present: number
  absent: number
  leave: number
}

export interface AttendanceMonthlySummary {
  period: string
  present: number
  absent: number
  leave: number
  daily: AttendanceDayEntry[]
}

export interface PayrollMonthEntry {
  year: number
  month: number
  totalNet: number
  totalGross: number
  count: number
}

export function getDashboardStats() {
  return apiFetch<DashboardStats>('/dashboard/stats')
}

export function getAttendanceMonthlySummary() {
  return apiFetch<AttendanceMonthlySummary>('/attendance/stats/monthly')
}

export function getPayrollTrend() {
  return apiFetch<PayrollMonthEntry[]>('/payroll/stats/trend')
}
