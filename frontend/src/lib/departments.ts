import { apiFetch } from './api'

export interface Department {
  id: string
  code: string
  name: string
  parentId?: string
  parentName?: string
  children?: Department[]
}

export function getDepartments() {
  return apiFetch<Department[]>('/personnel/departments')
}

export function getDepartmentTree() {
  return apiFetch<Department[]>('/personnel/departments/tree')
}
