'use client'
import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getRoleAssignments, updateRoleAssignment,
  HRM_ROLE_LABELS, HRM_ROLE_COLORS,
  type HrmRole, type RoleAssignment,
} from '@/lib/admin'
import { useRoles } from '@/hooks/useRoles'

const ROLES: HrmRole[] = ['ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER', 'ACCOUNTANT', 'EMPLOYEE']

function RoleBadge({ role }: { role: HrmRole | null }) {
  if (!role) return <span className="text-xs text-gray-400">—</span>
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${HRM_ROLE_COLORS[role]}`}>
      {HRM_ROLE_LABELS[role]}
    </span>
  )
}

function EditRoleModal({
  emp,
  onClose,
  onSave,
}: {
  emp: RoleAssignment
  onClose: () => void
  onSave: (id: string, role: HrmRole, keycloakUsername: string) => void
}) {
  const [role, setRole] = useState<HrmRole>((emp.hrmRole as HrmRole) ?? 'EMPLOYEE')
  const [username, setUsername] = useState(emp.keycloakUsername ?? '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Phân quyền — {emp.fullName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Info */}
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm space-y-1">
            <p><span className="text-gray-400">Mã NV:</span> <span className="font-mono text-gray-700">{emp.employeeCode}</span></p>
            <p><span className="text-gray-400">Email:</span> <span className="text-gray-700">{emp.email ?? '—'}</span></p>
            <p><span className="text-gray-400">Phòng ban:</span> <span className="text-gray-700">{emp.departmentName ?? '—'}</span></p>
          </div>

          {/* Vai trò */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Vai trò hệ thống</label>
            <div className="space-y-2">
              {ROLES.map(r => (
                <label key={r} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors
                  ${role === r ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={role === r}
                    onChange={() => setRole(r)}
                    className="accent-blue-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{HRM_ROLE_LABELS[r]}</p>
                    <p className="text-xs text-gray-400">{ROLE_DESC[r]}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Keycloak username */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Tên đăng nhập Keycloak
              <span className="ml-1 text-gray-400 font-normal">(để đồng bộ quyền ngay)</span>
            </label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="vd: minhnqn"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100">
            Hủy
          </button>
          <button onClick={() => onSave(emp.id, role, username)}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            Lưu phân quyền
          </button>
        </div>
      </div>
    </div>
  )
}

const ROLE_DESC: Record<HrmRole, string> = {
  ADMIN:              'Toàn quyền hệ thống, quản lý cài đặt',
  HR_MANAGER:         'Quản lý nhân sự, lương, chấm công toàn viện',
  DEPARTMENT_MANAGER: 'Xem nhân sự & chấm công trong khoa/phòng',
  ACCOUNTANT:         'Xem và xuất bảng lương',
  EMPLOYEE:           'Xem hồ sơ và lương cá nhân',
}

export default function SettingsPage() {
  const { isAdmin } = useRoles()
  const qc = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const [pendingKeyword, setPendingKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState<RoleAssignment | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['role-assignments', keyword, page],
    queryFn: () => getRoleAssignments({ keyword, page, size: 20 }),
    enabled: isAdmin,
  })

  const update = useMutation({
    mutationFn: ({ id, role, keycloakUsername }: { id: string; role: HrmRole; keycloakUsername: string }) =>
      updateRoleAssignment(id, role, keycloakUsername),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['role-assignments'] })
      setEditing(null)
      setToast({ msg: `Đã lưu — ${result}`, ok: true })
      setTimeout(() => setToast(null), 3500)
    },
    onError: () => {
      setToast({ msg: 'Lỗi khi lưu phân quyền', ok: false })
      setTimeout(() => setToast(null), 3500)
    },
  })

  const handleSave = useCallback((id: string, role: HrmRole, keycloakUsername: string) => {
    update.mutate({ id, role, keycloakUsername })
  }, [update])

  if (!isAdmin) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center text-sm text-red-700 max-w-lg mx-auto mt-8">
        <p className="font-semibold">Không có quyền truy cập</p>
        <p className="mt-1">Trang này chỉ dành cho quản trị viên hệ thống.</p>
      </div>
    )
  }

  const totalPages = data ? Math.ceil(data.totalElements / 20) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Cài đặt hệ thống</h1>
        <p className="text-sm text-gray-500 mt-0.5">Quản lý phân quyền tài khoản người dùng</p>
      </div>

      {/* Section phân quyền */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Section header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Phân quyền sử dụng</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Gán vai trò cho từng nhân viên. Thay đổi có hiệu lực sau lần đăng nhập kế tiếp.
            </p>
          </div>
          <span className="text-xs text-gray-400">{data?.totalElements ?? '—'} tài khoản</span>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-100 flex gap-3">
          <input
            type="text"
            placeholder="Tìm theo tên, mã cán bộ..."
            value={pendingKeyword}
            onChange={e => setPendingKeyword(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setKeyword(pendingKeyword); setPage(0) } }}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => { setKeyword(pendingKeyword); setPage(0) }}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tìm
          </button>
        </div>

        {/* Table */}
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3 text-left">Mã NV</th>
              <th className="px-5 py-3 text-left">Họ tên</th>
              <th className="px-5 py-3 text-left">Phòng ban</th>
              <th className="px-5 py-3 text-left">Tên đăng nhập</th>
              <th className="px-5 py-3 text-left">Vai trò hiện tại</th>
              <th className="px-5 py-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">Đang tải...</td></tr>
            )}
            {!isLoading && data?.content?.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">Không tìm thấy</td></tr>
            )}
            {data?.content?.map(emp => (
              <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-gray-500">{emp.employeeCode}</td>
                <td className="px-5 py-3">
                  <p className="font-medium text-gray-800">{emp.fullName}</p>
                  <p className="text-xs text-gray-400">{emp.email}</p>
                </td>
                <td className="px-5 py-3 text-xs text-gray-500">{emp.departmentName ?? '—'}</td>
                <td className="px-5 py-3">
                  {emp.keycloakUsername
                    ? <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{emp.keycloakUsername}</span>
                    : <span className="text-xs text-gray-300">chưa liên kết</span>
                  }
                </td>
                <td className="px-5 py-3">
                  <RoleBadge role={emp.hrmRole as HrmRole} />
                </td>
                <td className="px-5 py-3 text-center">
                  <button
                    onClick={() => setEditing(emp)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
                      bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Phân quyền
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>{data!.totalElements} tài khoản — trang {page + 1}/{totalPages}</span>
            <div className="flex gap-1">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">‹</button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">›</button>
            </div>
          </div>
        )}
      </div>

      {/* Bảng vai trò */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Mô tả các vai trò</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {ROLES.map(r => (
            <div key={r} className="px-5 py-3 flex items-center gap-4">
              <div className="w-40 flex-shrink-0">
                <RoleBadge role={r} />
              </div>
              <p className="text-sm text-gray-600">{ROLE_DESC[r]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {editing && (
        <EditRoleModal
          emp={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium
          ${toast.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
