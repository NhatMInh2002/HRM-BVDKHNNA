'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import {
  getDailyAttendance,
  checkIn,
  checkOut,
  ATTENDANCE_STATUS_LABELS,
  type AttendanceStatus,
} from '@/lib/attendance'
import { Badge } from '@/components/ui/badge'

const STATUS_VARIANT: Record<AttendanceStatus, 'green' | 'red' | 'yellow' | 'blue' | 'gray'> = {
  PRESENT: 'green', ABSENT: 'red', LATE: 'yellow', HALF_DAY: 'blue', LEAVE: 'gray',
}

function formatTime(iso?: string) {
  if (!iso) return '—'
  return format(new Date(iso), 'HH:mm')
}

function formatDuration(mins?: number) {
  if (!mins) return '—'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}g ${m}p` : `${m}p`
}

export default function AttendancePage() {
  const { data: session } = useSession()
  const roles = session?.roles ?? []
  const canManage = roles.includes('ADMIN') || roles.includes('HR_MANAGER') || roles.includes('DEPARTMENT_MANAGER')

  const today = format(new Date(), 'yyyy-MM-dd')
  const [date, setDate] = useState(today)
  const [page, setPage] = useState(0)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['daily-attendance', date, page],
    queryFn: () => getDailyAttendance(date, page),
    enabled: canManage,
    placeholderData: prev => prev,
  })

  const ciMutation = useMutation({
    mutationFn: checkIn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daily-attendance'] }),
  })
  const coMutation = useMutation({
    mutationFn: checkOut,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daily-attendance'] }),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Chấm công</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {data?.totalElements ?? '—'} nhân viên ngày {format(new Date(date), 'dd/MM/yyyy')}
          </p>
        </div>
        {/* Quick check-in/out cho chính mình */}
        {!canManage && (
          <div className="flex gap-2">
            <button
              onClick={() => ciMutation.mutate({ employeeId: session?.user?.email ?? '' })}
              disabled={ciMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
            >
              Check-in
            </button>
            <button
              onClick={() => coMutation.mutate({ employeeId: session?.user?.email ?? '' })}
              disabled={coMutation.isPending}
              className="bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
            >
              Check-out
            </button>
          </div>
        )}
      </div>

      {/* Date picker */}
      {canManage && (
        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm text-gray-600 font-medium">Ngày:</label>
          <input
            type="date"
            value={date}
            max={today}
            onChange={e => { setDate(e.target.value); setPage(0) }}
            className="input w-44"
          />
          <button
            onClick={() => { setDate(today); setPage(0) }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Hôm nay
          </button>
          <span className="text-sm text-gray-400">
            {data ? `${data.totalElements} nhân viên` : ''}
          </span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Nhân viên</th>
              <th className="px-4 py-3 text-left">Check-in</th>
              <th className="px-4 py-3 text-left">Check-out</th>
              <th className="px-4 py-3 text-left">Thời gian</th>
              <th className="px-4 py-3 text-left">Trạng thái</th>
              <th className="px-4 py-3 text-left">Ghi chú</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Đang tải...</td></tr>
            )}
            {!isLoading && !canManage && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                Bạn không có quyền xem danh sách chấm công.
              </td></tr>
            )}
            {!isLoading && canManage && data?.content?.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                Chưa có dữ liệu chấm công ngày này.
              </td></tr>
            )}
            {canManage && data?.content?.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.employeeId}</td>
                <td className="px-4 py-3 font-medium text-gray-700">{formatTime(r.checkIn)}</td>
                <td className="px-4 py-3 text-gray-600">{formatTime(r.checkOut)}</td>
                <td className="px-4 py-3 text-gray-600">{formatDuration(r.durationMinutes)}</td>
                <td className="px-4 py-3">
                  <Badge label={ATTENDANCE_STATUS_LABELS[r.status]} variant={STATUS_VARIANT[r.status]} />
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{r.note ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>Trang {data.number + 1} / {data.totalPages}</span>
            <div className="flex gap-2">
              <button disabled={data.number === 0} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">← Trước</button>
              <button disabled={data.number >= data.totalPages - 1} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Sau →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
