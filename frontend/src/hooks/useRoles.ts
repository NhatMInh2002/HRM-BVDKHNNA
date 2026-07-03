'use client'
import { useSession } from 'next-auth/react'

export type AppRole = 'ADMIN' | 'HR_MANAGER' | 'DEPARTMENT_MANAGER' | 'DEPT_HEAD' | 'NURSE_MANAGER' | 'EMPLOYEE' | 'ACCOUNTANT'

export function useRoles() {
  const { data: session } = useSession()
  const roles = (session?.roles ?? []) as AppRole[]
  // Cũng xét role đơn lẻ từ session.role (backend trả về single role)
  const singleRole = (session as any)?.role as string | undefined
  const allRoles = [...new Set([...roles, singleRole].filter(Boolean))] as AppRole[]

  const has = (...r: AppRole[]) => r.some(x => allRoles.includes(x))

  return {
    roles: allRoles,
    isAdmin:       has('ADMIN'),
    isHR:          has('ADMIN', 'HR_MANAGER'),
    isDeptHead:    has('ADMIN', 'DEPT_HEAD'),
    isNurseManager: has('NURSE_MANAGER'),
    isDeptManager: has('DEPARTMENT_MANAGER', 'DEPT_HEAD', 'NURSE_MANAGER'),
    isEmployee:    has('EMPLOYEE'),
    isAccountant:  has('ACCOUNTANT'),
    // quyền ghi dữ liệu nhân sự
    canWriteHR:    has('ADMIN', 'HR_MANAGER'),
    // quyền xem + xuất lương
    canViewPayroll: has('ADMIN', 'HR_MANAGER', 'ACCOUNTANT'),
    // quyền duyệt nghỉ phép (cấp 1: trưởng khoa/phòng + điều dưỡng trưởng; cấp 2: TCCB)
    canApproveLeave: has('ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER', 'DEPT_HEAD', 'NURSE_MANAGER'),
    // quyền xem bảng chấm công
    canViewAttendance: has('ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER', 'DEPT_HEAD', 'NURSE_MANAGER'),
    // navigation helper
    canAccess: (...required: AppRole[]) =>
      required.length === 0 || required.some(r => roles.includes(r)),
  }
}
