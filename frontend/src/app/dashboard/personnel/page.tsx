'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  searchEmployees,
  getDepartments,
  terminateEmployee,
  exportEmployeesExcel,
  STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
  type EmployeeStatus,
} from '@/lib/personnel'
import { Badge } from '@/components/ui/badge'
import { EmployeeFormModal } from '@/components/personnel/employee-form-modal'
import { EmployeeProfileModal } from '@/components/personnel/employee-profile-modal'
import { format } from 'date-fns'
import { useRoles } from '@/hooks/useRoles'
import { ModalPortal } from '@/components/modal-portal'

const STATUS_VARIANT = {
  ACTIVE: 'green',
  PROBATION: 'yellow',
  TERMINATED: 'red',
} as const

export default function PersonnelPage() {
  const { canWriteHR: canWrite } = useRoles()

  const qc = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<EmployeeStatus | ''>('')
  const [departmentId, setDepartmentId] = useState('')
  const [pendingKeyword, setPendingKeyword] = useState('')
  const [pendingStatus, setPendingStatus] = useState<EmployeeStatus | ''>('')
  const [pendingDept, setPendingDept] = useState('')
  const [page, setPage] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportEmployeesExcel({ keyword, status, departmentId })
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setExporting(false)
    }
  }

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
    staleTime: 5 * 60_000,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['employees', keyword, status, departmentId, page],
    queryFn: () => searchEmployees({ keyword, status, departmentId, page, size: 20 }),
    placeholderData: (prev) => prev,
  })

  const handleSearch = () => {
    setKeyword(pendingKeyword)
    setStatus(pendingStatus)
    setDepartmentId(pendingDept)
    setPage(0)
  }

  const terminate = useMutation({
    mutationFn: terminateEmployee,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  })

  const handleTerminate = (id: string, name: string) => {
    if (confirm(`Ẩn nhân viên "${name}"?\nDữ liệu vẫn được lưu trong hệ thống, có thể khôi phục sau.`)) {
      terminate.mutate(id)
    }
  }

  const DEFAULT_PASSWORD = 'NgheAn@2026'

  // Hồ sơ lý lịch HS02
  const [profileTarget, setProfileTarget] = useState<{ id: string; name: string } | null>(null)

  // Reset password
  const [resetTarget, setResetTarget] = useState<{ id: string; name: string } | null>(null)
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const resetMut = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      import('@/lib/api').then(({ apiFetch }) =>
        apiFetch('/auth-backend/admin/reset-password', {
          method: 'POST',
          body: JSON.stringify({ employeeId: id, newPassword: DEFAULT_PASSWORD }),
        })
      ),
    onSuccess: () => {
      setPwdMsg({ ok: true, text: `Đặt lại thành công. Mật khẩu mặc định: ${DEFAULT_PASSWORD}` })
      setTimeout(() => { setResetTarget(null); setPwdMsg(null) }, 3000)
    },
    onError: (e: Error) => setPwdMsg({ ok: false, text: e.message }),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Nhân sự</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {data?.totalElements ?? '—'} nhân viên
          </p>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            <button
              onClick={() => { setEditId(null); setShowForm(true) }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors"
            >
              + Thêm
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? 'Đang xuất...' : '↓ Xuất Excel'}
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Họ tên / Mã cán bộ</label>
            <input
              type="text"
              placeholder="Tìm theo tên, mã, email..."
              value={pendingKeyword}
              onChange={e => setPendingKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-64">
            <label className="block text-xs font-medium text-gray-600 mb-1">Phòng/Tổ</label>
            <select
              value={pendingDept}
              onChange={e => setPendingDept(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Chọn phòng/tổ</option>
              {departments.filter(d => !d.code.startsWith('GRP-')).map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="w-48">
            <label className="block text-xs font-medium text-gray-600 mb-1">Trạng thái</label>
            <select
              value={pendingStatus}
              onChange={e => setPendingStatus(e.target.value as EmployeeStatus | '')}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              <option value="ACTIVE">Đang làm việc</option>
              <option value="PROBATION">Thử việc</option>
              <option value="TERMINATED">Đã nghỉ việc</option>
            </select>
          </div>
          <button
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded transition-colors flex items-center gap-1.5"
          >
            🔍 Tìm
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Mã NV</th>
              <th className="px-4 py-3 text-left">Họ tên</th>
              <th className="px-4 py-3 text-left">SĐT</th>
              <th className="px-4 py-3 text-left">Phòng ban</th>
              <th className="px-4 py-3 text-left">Chức vụ</th>
              <th className="px-4 py-3 text-left">Vào làm</th>
              <th className="px-4 py-3 text-left">Hợp đồng</th>
              <th className="px-4 py-3 text-left">Trạng thái</th>
              {canWrite && <th className="px-4 py-3 text-center w-28">Thao tác</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                  Đang tải...
                </td>
              </tr>
            )}
            {!isLoading && data?.content?.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                  Không tìm thấy nhân viên nào
                </td>
              </tr>
            )}
            {data?.content?.map(emp => (
              <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-gray-500 text-xs">{emp.employeeCode}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">{emp.fullName}</div>
                  <div className="text-xs text-gray-400">{emp.email}</div>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">{emp.phone ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{emp.department?.name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{emp.position ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {emp.joinDate ? format(new Date(emp.joinDate), 'dd/MM/yyyy') : '—'}
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {CONTRACT_TYPE_LABELS[emp.contractType]}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    label={STATUS_LABELS[emp.status]}
                    variant={STATUS_VARIANT[emp.status]}
                  />
                </td>
                {canWrite && (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setProfileTarget({ id: emp.id, name: emp.fullName })}
                        title="Sơ yếu lý lịch (HS02-VC/BNV)"
                        className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => { setEditId(emp.id); setShowForm(true) }}
                        title="Sửa thông tin"
                        className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => { setResetTarget({ id: emp.id, name: emp.fullName }); setPwdMsg(null) }}
                        title="Đặt lại mật khẩu"
                        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </button>
                      {emp.status !== 'TERMINATED' && (
                        <button
                          onClick={() => handleTerminate(emp.id, emp.fullName)}
                          title="Cho nghỉ việc"
                          className="p-1.5 rounded-md text-orange-600 hover:bg-orange-50 border border-transparent hover:border-orange-200 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>{data.totalElements} nhân viên — trang {data.number + 1} / {data.totalPages}</span>
            <div className="flex items-center gap-1">
              <button
                disabled={data.number === 0}
                onClick={() => setPage(0)}
                className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 text-xs"
              >«</button>
              <button
                disabled={data.number === 0}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >‹</button>
              {(() => {
                const cur = data.number
                const total = data.totalPages
                const pages: (number | '...')[] = []
                if (total <= 7) {
                  for (let i = 0; i < total; i++) pages.push(i)
                } else {
                  pages.push(0)
                  if (cur > 2) pages.push('...')
                  for (let i = Math.max(1, cur - 1); i <= Math.min(total - 2, cur + 1); i++) pages.push(i)
                  if (cur < total - 3) pages.push('...')
                  pages.push(total - 1)
                }
                return pages.map((p, i) =>
                  p === '...'
                    ? <span key={`e${i}`} className="px-2 text-gray-400">…</span>
                    : <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-3 py-1 rounded border text-sm transition-colors
                          ${p === cur
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-200 hover:bg-gray-50'}`}
                      >{p + 1}</button>
                )
              })()}
              <button
                disabled={data.number >= data.totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >›</button>
              <button
                disabled={data.number >= data.totalPages - 1}
                onClick={() => setPage(data.totalPages - 1)}
                className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 text-xs"
              >»</button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <EmployeeFormModal
          editId={editId}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false)
            qc.invalidateQueries({ queryKey: ['employees'] })
          }}
        />
      )}

      {profileTarget && (
        <EmployeeProfileModal
          employeeId={profileTarget.id}
          employeeName={profileTarget.name}
          canWrite={canWrite}
          onClose={() => setProfileTarget(null)}
        />
      )}

      {/* Modal đặt lại mật khẩu */}
      {resetTarget && (
        <ModalPortal onClose={() => { setResetTarget(null); setPwdMsg(null) }}>
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            {pwdMsg?.ok ? (
              /* Trạng thái thành công */
              <div className="flex flex-col items-center text-center p-8 gap-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-lg">Đặt lại thành công</p>
                  <p className="text-sm text-gray-500 mt-1">{resetTarget.name}</p>
                </div>
                <div className="bg-gray-50 rounded-xl px-5 py-3 w-full">
                  <p className="text-xs text-gray-400 mb-1">Mật khẩu mới</p>
                  <p className="font-mono font-bold text-gray-800 text-lg tracking-wider">{DEFAULT_PASSWORD}</p>
                </div>
                <p className="text-xs text-gray-400">Cửa sổ sẽ tự đóng sau 3 giây</p>
              </div>
            ) : (
              /* Trạng thái xác nhận */
              <>
                <div className="px-6 pt-6 pb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">Đặt lại mật khẩu</h3>
                      <p className="text-sm text-gray-400">{resetTarget.name}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Mật khẩu của nhân viên sẽ được đặt lại về mặc định:
                  </p>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
                    <span className="font-mono font-bold text-amber-800 text-base tracking-wider">{DEFAULT_PASSWORD}</span>
                    <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Mặc định</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Nhân viên nên đổi mật khẩu sau lần đăng nhập đầu tiên.</p>
                  {pwdMsg && !pwdMsg.ok && (
                    <p className="text-sm text-red-500 mt-3 font-medium">✗ {pwdMsg.text}</p>
                  )}
                </div>
                <div className="flex border-t border-gray-100">
                  <button
                    onClick={() => { setResetTarget(null); setPwdMsg(null) }}
                    className="flex-1 py-3.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <div className="w-px bg-gray-100" />
                  <button
                    onClick={() => resetMut.mutate({ id: resetTarget.id })}
                    disabled={resetMut.isPending}
                    className="flex-1 py-3.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    {resetMut.isPending ? 'Đang lưu...' : 'Xác nhận'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  )
}
