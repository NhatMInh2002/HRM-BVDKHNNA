'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import {
  listPayroll, generatePayroll, approvePayroll, markPaid,
  downloadPayslipPdf, exportPayrollExcel,
  PayrollRecord, PAYROLL_STATUS_LABELS, PAYROLL_STATUS_COLORS,
} from '@/lib/payroll'

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

function StatusBadge({ status }: { status: PayrollRecord['status'] }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PAYROLL_STATUS_COLORS[status]}`}>
      {PAYROLL_STATUS_LABELS[status]}
    </span>
  )
}

export default function PayrollPage() {
  const { data: session } = useSession()
  const roles = session?.roles ?? []
  const isAdmin = roles.includes('ADMIN')
  const isHr = roles.includes('HR_MANAGER') || isAdmin
  const qc = useQueryClient()

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['payroll', year, month, page],
    queryFn: () => listPayroll(year, month, page),
    enabled: isHr,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['payroll', year, month] })

  const generateMut = useMutation({
    mutationFn: () => generatePayroll(year, month),
    onSuccess: (res) => {
      alert(`Đã tạo ${res.generated} phiếu lương tháng ${month}/${year}`)
      invalidate()
    },
  })

  const approveMut = useMutation({
    mutationFn: approvePayroll,
    onSuccess: invalidate,
  })

  const paidMut = useMutation({
    mutationFn: markPaid,
    onSuccess: invalidate,
  })

  if (!isHr) {
    return (
      <div className="text-gray-500 text-sm p-8 text-center">
        Bạn không có quyền xem trang này.
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bảng lương</h1>
          <p className="text-sm text-gray-500 mt-0.5">Quản lý lương tháng nhân viên</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportPayrollExcel(year, month).catch(e => alert(e.message))}
            className="bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg
                       hover:bg-green-700 transition-colors"
          >
            Xuất Excel
          </button>
          <button
            onClick={() => generateMut.mutate()}
            disabled={generateMut.isPending}
            className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg
                       hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {generateMut.isPending ? 'Đang tạo…' : `Tính lương ${month}/${year}`}
          </button>
        </div>
      </div>

      {/* Period picker */}
      <div className="flex gap-3 mb-5">
        <select
          value={month}
          onChange={e => { setMonth(+e.target.value); setPage(0) }}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={e => { setYear(+e.target.value); setPage(0) }}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        >
          {[2024, 2025, 2026].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Nhân viên</th>
              <th className="px-4 py-3 text-right">Lương CB</th>
              <th className="px-4 py-3 text-right">Phụ cấp</th>
              <th className="px-4 py-3 text-right">Gross</th>
              <th className="px-4 py-3 text-right">BHXH+BHYT+PIT</th>
              <th className="px-4 py-3 text-right font-bold text-gray-700">Thực nhận</th>
              <th className="px-4 py-3 text-center">Công</th>
              <th className="px-4 py-3 text-center">Trạng thái</th>
              <th className="px-4 py-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-400">Đang tải…</td>
              </tr>
            )}
            {!isLoading && (!data?.content?.length) && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                  Chưa có dữ liệu lương. Nhấn &quot;Tính lương&quot; để tạo.
                </td>
              </tr>
            )}
            {data?.content?.map(rec => (
              <tr key={rec.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">
                  {rec.employeeId.slice(0, 8)}…
                </td>
                <td className="px-4 py-3 text-right">{fmt(rec.basicSalary)}</td>
                <td className="px-4 py-3 text-right">{fmt(rec.totalAllowance)}</td>
                <td className="px-4 py-3 text-right">{fmt(rec.grossSalary)}</td>
                <td className="px-4 py-3 text-right text-red-600">
                  {fmt(rec.bhxhEmployee + rec.bhytEmployee + rec.bhtnEmployee + rec.pit)}
                </td>
                <td className="px-4 py-3 text-right font-bold text-green-700">
                  {fmt(rec.netSalary)}
                </td>
                <td className="px-4 py-3 text-center text-gray-600">
                  {rec.actualDays}/{rec.workingDays}
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge status={rec.status} />
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex gap-1 justify-center">
                    {rec.status === 'DRAFT' && (
                      <button
                        onClick={() => approveMut.mutate(rec.id)}
                        disabled={approveMut.isPending}
                        className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                      >
                        Duyệt
                      </button>
                    )}
                    {rec.status === 'APPROVED' && isAdmin && (
                      <button
                        onClick={() => paidMut.mutate(rec.id)}
                        disabled={paidMut.isPending}
                        className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100"
                      >
                        Đã trả
                      </button>
                    )}
                    <button
                      onClick={() => downloadPayslipPdf(rec.id).catch(e => alert(e.message))}
                      className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded hover:bg-gray-100"
                    >
                      PDF
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              {data.totalElements} phiếu lương
            </span>
            <div className="flex gap-1">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 text-xs border rounded disabled:opacity-40 hover:bg-gray-50"
              >
                ← Trước
              </button>
              <span className="px-3 py-1 text-xs text-gray-500">
                {page + 1} / {data.totalPages}
              </span>
              <button
                disabled={page + 1 >= data.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 text-xs border rounded disabled:opacity-40 hover:bg-gray-50"
              >
                Tiếp →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
