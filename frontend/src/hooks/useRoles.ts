'use client'
import { useSession } from 'next-auth/react'

export type AppRole = 'ADMIN' | 'HR_MANAGER' | 'DEPARTMENT_MANAGER' | 'EMPLOYEE' | 'ACCOUNTANT'

export function useRoles() {
  const { data: session } = useSession()
  const roles = (session?.roles ?? []) as AppRole[]

  const has = (...r: AppRole[]) => r.some(x => roles.includes(x))

  return {
    roles,
    isAdmin:       has('ADMIN'),
    isHR:          has('ADMIN', 'HR_MANAGER'),
    isDeptManager: has('DEPARTMENT_MANAGER'),
    isEmployee:    has('EMPLOYEE'),
    isAccountant:  has('ACCOUNTANT'),
    // quyền ghi dữ liệu nhân sự
    canWriteHR:    has('ADMIN', 'HR_MANAGER'),
    // quyền xem + xuất lương
    canViewPayroll: has('ADMIN', 'HR_MANAGER', 'ACCOUNTANT'),
    // quyền duyệt nghỉ phép
    canApproveLeave: has('ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'),
    // quyền xem bảng chấm công
    canViewAttendance: has('ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'),
    // navigation helper
    canAccess: (...required: AppRole[]) =>
      required.length === 0 || required.some(r => roles.includes(r)),
  }
}
