'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  searchEmployees,
  terminateEmployee,
  STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
  type EmployeeStatus,
} from '@/lib/personnel'
import { Badge } from '@/components/ui/badge'
import { EmployeeFormModal } from '@/components/personnel/employee-form-modal'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'

const STATUS_VARIANT = {
  ACTIVE: 'green',
  PROBATION: 'yellow',
  TERMINATED: 'red',
} as const

export default function PersonnelPage() {
  const { data: session } = useSession()
  const roles = session?.roles ?? []
  const canWrite = roles.includes('ADMIN') || roles.includes('HR_MANAGER')

  const qc = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<EmployeeStatus | ''>('')
  const [page, setPage] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['employees', keyword, status, page],
    queryFn: () => searchEmployees({ keyword, status, page, size: 20 }),
    placeholderData: (prev) => prev,
  })

  const terminate = useMutation({
    mutationFn: terminateEmployee,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  })

  const handleTerminate = (id: string, name: string) => {
    if (confirm(`Xác nhận cho thôi việc nhân viên "${name}"?`)) {
      terminate.mutate(id)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Nhân sự</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {data?.totalElements ?? '—'} nhân viên
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => { setEditId(null); setShowForm(true) }}
            className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Thêm nhân viên
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Tìm theo tên, mã, email..."
          value={keyword}
          onChange={e => { setKeyword(e.target.value); setPage(0) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={status}
          onChange={e => { setStatus(e.target.value as EmployeeStatus | ''); setPage(0) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang làm việc</option>
          <option value="PROBATION">Thử việc</option>
          <option value="TERMINATED">Đã nghỉ việc</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Mã NV</th>
              <th className="px-4 py-3 text-left">Họ tên</th>
              <th className="px-4 py-3 text-left">Phòng ban</th>
              <th className="px-4 py-3 text-left">Chức vụ</th>
              <th className="px-4 py-3 text-left">Vào làm</th>
              <th className="px-4 py-3 text-left">Hợp đồng</th>
              <th className="px-4 py-3 text-left">Trạng thái</th>
              {canWrite && <th className="px-4 py-3 text-right">Thao tác</th>}
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
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => { setEditId(emp.id); setShowForm(true) }}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      Sửa
                    </button>
                    {emp.status !== 'TERMINATED' && (
                      <button
                        onClick={() => handleTerminate(emp.id, emp.fullName)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                      >
                        Cho thôi việc
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>
              Trang {data.number + 1} / {data.totalPages} — {data.totalElements} nhân viên
            </span>
            <div className="flex gap-2">
              <button
                disabled={data.number === 0}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                ← Trước
              </button>
              <button
                disabled={data.number >= data.totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                Sau →
              </button>
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
