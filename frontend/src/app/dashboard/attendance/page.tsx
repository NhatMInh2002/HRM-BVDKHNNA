'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRoles } from '@/hooks/useRoles'
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee'
import { format, getDaysInMonth, startOfMonth, getDay, parseISO, differenceInMinutes } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  getDailyAttendance,
  getMonthlyReport,
  type AttendanceRecord,
  type AttendanceStatus,
} from '@/lib/attendance'
import { Badge } from '@/components/ui/badge'

// ── helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: 'Đúng giờ', ABSENT: 'Vắng', LATE: 'Đi muộn', HALF_DAY: 'Nửa ngày', LEAVE: 'Nghỉ phép',
}
const STATUS_VARIANT: Record<AttendanceStatus, 'green' | 'red' | 'yellow' | 'blue' | 'gray'> = {
  PRESENT: 'green', ABSENT: 'red', LATE: 'yellow', HALF_DAY: 'blue', LEAVE: 'gray',
}
// Màu calendar dựa theo giờ làm thực tế (không theo status backend)
function calendarColor(r: AttendanceRecord): string {
  if (r.status === 'LEAVE') return 'bg-purple-100 text-purple-700 border-purple-200'
  if (r.status === 'ABSENT') return 'bg-red-100 text-red-700 border-red-200'
  // Có check-in nhưng thiếu check-out → đỏ
  if (r.checkIn && !r.checkOut) return 'bg-red-100 text-red-700 border-red-200'
  // Tính số phút làm thực tế
  const mins = r.durationMinutes
    ?? (r.checkIn && r.checkOut
        ? differenceInMinutes(parseISO(r.checkOut), parseISO(r.checkIn))
        : 0)
  if (mins >= 480) return 'bg-green-100 text-green-800 border-green-200'   // ≥ 8 tiếng → xanh
  if (mins > 0)   return 'bg-yellow-100 text-yellow-800 border-yellow-200' // < 8 tiếng → vàng
  return 'bg-red-100 text-red-700 border-red-200'                           // 0 phút → đỏ
}

function fmtTime(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('vi-VN', {
    hour: '2-digit', minute: '2-digit', hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh',
  })
}
function fmtDur(r: AttendanceRecord) {
  if (r.durationMinutes) {
    const h = Math.floor(r.durationMinutes / 60), m = r.durationMinutes % 60
    return h > 0 ? `${h}g${m > 0 ? ` ${m}p` : ''}` : `${m}p`
  }
  if (r.checkIn && r.checkOut) {
    const mins = differenceInMinutes(parseISO(r.checkOut), parseISO(r.checkIn))
    const h = Math.floor(mins / 60), m = mins % 60
    return h > 0 ? `${h}g${m > 0 ? ` ${m}p` : ''}` : `${m}p`
  }
  return '—'
}

// ── Employee view ─────────────────────────────────────────────────────────────

function EmployeeAttendance() {
  const today = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const { data: me }      = useCurrentEmployee()

  const { data: records = [], isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ['my-attendance', me?.id, year, month],
    queryFn:  () => getMonthlyReport(me!.id, year, month),
    enabled:  !!me?.id,
  })

  const todayStr  = format(today, 'yyyy-MM-dd')
  const todayRec  = records.find(r => r.workDate === todayStr)

  // helpers for stats
  const getMins = (r: AttendanceRecord) =>
    r.durationMinutes ?? (r.checkIn && r.checkOut
      ? differenceInMinutes(parseISO(r.checkOut), parseISO(r.checkIn)) : 0)

  // stats — dựa theo giờ thực tế, không theo status backend
  const fullDays  = records.filter(r => getMins(r) >= 480).length           // ≥ 8 tiếng
  const shortDays = records.filter(r => { const m = getMins(r); return m > 0 && m < 480 }).length // < 8 tiếng
  const missingCheck = records.filter(r =>
    r.status !== 'LEAVE' && ((!r.checkIn) || (r.checkIn && !r.checkOut))
  ).length
  const totalMins = records.reduce((acc, r) => acc + getMins(r), 0)
  const totalHrs  = Math.floor(totalMins / 60)
  const totalMinsRem = totalMins % 60

  // calendar grid
  const daysInMonth   = getDaysInMonth(new Date(year, month - 1))
  const firstDow      = getDay(startOfMonth(new Date(year, month - 1))) // 0=Sun
  const startPadding  = firstDow === 0 ? 6 : firstDow - 1              // Mon-first
  const recordByDate  = Object.fromEntries(records.map(r => [r.workDate, r]))

  const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12) } else setMonth(m => m - 1) }
  const nextMonth = () => {
    const n = new Date(year, month - 1)
    if (n >= new Date(today.getFullYear(), today.getMonth())) return
    if (month === 12) { setYear(y => y + 1); setMonth(1) } else setMonth(m => m + 1)
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Chấm công</h1>
          <p className="text-sm text-gray-500 mt-0.5">Theo dõi thời gian làm việc của bạn</p>
        </div>
      </div>

      {/* ── Today card ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            Hôm nay — {format(today, 'EEEE, dd/MM/yyyy', { locale: vi })}
          </span>
          {todayRec
            ? <Badge label={STATUS_LABEL[todayRec.status]} variant={STATUS_VARIANT[todayRec.status]} />
            : <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Chưa chấm công</span>
          }
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Giờ vào</p>
            <p className="text-2xl font-bold text-gray-800">{fmtTime(todayRec?.checkIn)}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Giờ ra</p>
            <p className="text-2xl font-bold text-gray-800">{fmtTime(todayRec?.checkOut)}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Thời gian làm</p>
            <p className="text-2xl font-bold text-gray-800">{todayRec ? fmtDur(todayRec) : '—'}</p>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Đủ 8 tiếng',     value: fullDays,                                        color: 'text-green-600' },
          { label: 'Thiếu giờ',      value: shortDays,                                       color: 'text-yellow-600' },
          { label: 'Thiếu dấu chấm', value: missingCheck,                                    color: 'text-red-600' },
          { label: 'Tổng giờ làm',   value: `${totalHrs}h${totalMinsRem > 0 ? ` ${totalMinsRem}p` : ''}`, color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Calendar ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {/* month nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600">‹</button>
          <h3 className="text-sm font-semibold text-gray-700">
            {format(new Date(year, month - 1), 'MMMM yyyy', { locale: vi })}
          </h3>
          <button
            onClick={nextMonth}
            disabled={year === today.getFullYear() && month === today.getMonth() + 1}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 disabled:opacity-30"
          >›</button>
        </div>

        {/* day headers */}
        <div className="grid grid-cols-7 mb-2">
          {['T2','T3','T4','T5','T6','T7','CN'].map(d => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* cells */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startPadding }).map((_, i) => <div key={`pad-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day   = i + 1
            const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
            const rec   = recordByDate[dateStr]
            const isToday = dateStr === todayStr
            const dow   = (startPadding + i) % 7        // 0=Mon … 6=Sun
            const isWeekend = dow >= 5

            let cellClass = 'rounded-lg border text-center text-xs py-1.5 relative '
            if (rec) {
              cellClass += calendarColor(rec)
            } else if (isWeekend) {
              cellClass += 'bg-gray-50 text-gray-300 border-transparent'
            } else if (dateStr > todayStr) {
              cellClass += 'bg-white text-gray-300 border-transparent'
            } else {
              cellClass += 'bg-white text-gray-400 border-gray-100'
            }

            return (
              <div key={day} className={cellClass} title={rec ? STATUS_LABEL[rec.status] : undefined}>
                {isToday && (
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                )}
                <div className="font-medium">{day}</div>
                {rec && <div className="text-[10px] leading-tight opacity-75">{fmtTime(rec.checkIn)}</div>}
              </div>
            )
          })}
        </div>

        {/* legend */}
        <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100">
          {([
            ['bg-green-100 border-green-200',  'Đủ 8 tiếng'],
            ['bg-yellow-100 border-yellow-200','Thiếu giờ (<8h)'],
            ['bg-red-100 border-red-200',      'Thiếu dấu chấm / Vắng'],
            ['bg-purple-100 border-purple-200','Nghỉ phép'],
          ] as const).map(([cls, l]) => (
            <div key={l} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded border ${cls}`} />
              <span className="text-xs text-gray-500">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── History table ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Lịch sử chi tiết</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Ngày</th>
              <th className="px-4 py-3 text-left">Giờ vào</th>
              <th className="px-4 py-3 text-left">Giờ ra</th>
              <th className="px-4 py-3 text-left">Thời gian</th>
              <th className="px-4 py-3 text-left">Trạng thái</th>
              <th className="px-4 py-3 text-left">Ghi chú</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Đang tải...</td></tr>
            )}
            {!isLoading && records.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Chưa có dữ liệu tháng này.</td></tr>
            )}
            {[...records].sort((a, b) => b.workDate.localeCompare(a.workDate)).map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-700">
                  {format(parseISO(r.workDate), 'EEE dd/MM', { locale: vi })}
                </td>
                <td className="px-4 py-3 text-gray-600">{fmtTime(r.checkIn)}</td>
                <td className="px-4 py-3 text-gray-600">{fmtTime(r.checkOut)}</td>
                <td className="px-4 py-3 text-gray-600">{fmtDur(r)}</td>
                <td className="px-4 py-3">
                  <Badge label={STATUS_LABEL[r.status]} variant={STATUS_VARIANT[r.status]} />
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{r.note ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Admin / HR view ───────────────────────────────────────────────────────────

function AdminAttendance() {
  const today   = format(new Date(), 'yyyy-MM-dd')
  const [date, setDate]   = useState(today)
  const [page, setPage]   = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['daily-attendance', date, page],
    queryFn:  () => getDailyAttendance(date, page),
    placeholderData: prev => prev,
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Chấm công</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {data ? `${data.totalElements} nhân viên` : '—'} ngày {format(new Date(date), 'dd/MM/yyyy')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm text-gray-600 font-medium">Ngày:</label>
        <input
          type="date" value={date} max={today}
          onChange={e => { setDate(e.target.value); setPage(0) }}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-44"
        />
        <button onClick={() => { setDate(today); setPage(0) }}
          className="text-sm text-blue-600 hover:text-blue-800">Hôm nay</button>
      </div>

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
            {!isLoading && data?.content?.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                Chưa có dữ liệu chấm công ngày này.
              </td></tr>
            )}
            {data?.content?.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-700">{r.fullName ?? '—'}</span>
                  {r.employeeCode && <span className="text-gray-400 ml-2 text-xs font-mono">{r.employeeCode}</span>}
                </td>
                <td className="px-4 py-3 font-medium text-gray-700">{fmtTime(r.checkIn)}</td>
                <td className="px-4 py-3 text-gray-600">{fmtTime(r.checkOut)}</td>
                <td className="px-4 py-3 text-gray-600">{fmtDur(r)}</td>
                <td className="px-4 py-3">
                  <Badge label={STATUS_LABEL[r.status]} variant={STATUS_VARIANT[r.status]} />
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

// ── Page entry ────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const { canViewAttendance } = useRoles()
  return canViewAttendance ? <AdminAttendance /> : <EmployeeAttendance />
}
