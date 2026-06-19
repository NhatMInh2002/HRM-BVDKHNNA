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
  return apiFetch<{ data: Department[] }>('/personnel/departments')
    .then(res => res.data)
}

export function getDepartmentTree() {
  return apiFetch<{ data: Department[] }>('/personnel/departments/tree')
    .then(res => res.data)
}
