import { apiFetch } from './api'

export interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  probationEmployees: number
  terminatedEmployees: number
  totalDepartments: number
}

export function getDashboardStats() {
  return apiFetch<{ data: DashboardStats }>('/dashboard/stats').then(r => r.data)
}
