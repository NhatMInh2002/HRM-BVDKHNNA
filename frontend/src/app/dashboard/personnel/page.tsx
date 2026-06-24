'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  searchEmployees,
  getDepartments,
  terminateEmployee,
  STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
  type EmployeeStatus,
} from '@/lib/personnel'
import { Badge } from '@/components/ui/badge'
import { EmployeeFormModal } from '@/components/personnel/employee-form-modal'
import { format } from 'date-fns'
import { useRoles } from '@/hooks/useRoles'

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
            <button className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors opacity-50 cursor-not-allowed" disabled>
              ↓ Xuất Excel
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
              {canWrite && <th className="px-4 py-3 text-center w-24">Thao tác</th>}
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
                        onClick={() => { setEditId(emp.id); setShowForm(true) }}
                        title="Sửa thông tin"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
                          bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200
                          transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Sửa
                      </button>
                      {emp.status !== 'TERMINATED' && (
                        <button
                          onClick={() => handleTerminate(emp.id, emp.fullName)}
                          title="Cho nghỉ việc — dữ liệu vẫn lưu trong DB"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
                            bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200
                            transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Nghỉ
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
    </div>
  )
}
