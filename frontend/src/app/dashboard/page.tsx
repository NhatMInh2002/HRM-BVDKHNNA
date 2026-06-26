'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import {
  getDashboardStats,
  getAttendanceMonthlySummary,
  getPayrollTrend,
} from '@/lib/dashboard'
import {
  getMonthlyReport,
  getMyLeaveRequests,
  LEAVE_TYPE_LABELS,
  LEAVE_STATUS_LABELS,
  AttendanceRecord,
  LeaveRequest,
} from '@/lib/attendance'
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee'

const MONTHS = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12']
const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

// ── Utilities ─────────────────────────────────────────────────────────────────
function fmtTime(iso?: string) {
  if (!iso) return null
  const t = iso.includes('T') ? iso.split('T')[1] : iso
  return t.slice(0, 5)
}

function fmtMinutes(mins?: number) {
  if (!mins) return null
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}g${m > 0 ? m + 'p' : ''}` : `${m}p`
}

function countStandardDays(year: number, month: number) {
  const days = new Date(year, month, 0).getDate()
  let count = 0
  for (let d = 1; d <= days; d++) {
    const dow = new Date(year, month - 1, d).getDay()
    if (dow !== 0 && dow !== 6) count++ // T2–T6, khớp backend PayrollService.countWorkdays()
  }
  return count
}

// ── Admin dashboard components ─────────────────────────────────────────────────
function StatCard({ label, value, sub, href, color }: {
  label: string; value: string | number; sub?: string; href?: string
  color: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple'
}) {
  const colors = {
    blue:   'bg-blue-50 border-blue-200 text-blue-700',
    green:  'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    red:    'bg-red-50 border-red-200 text-red-700',
    gray:   'bg-gray-50 border-gray-200 text-gray-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  }
  const card = (
    <div className={`rounded-xl border p-5 transition-shadow hover:shadow-md ${colors[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-4xl font-bold mt-2 mb-1">{value}</p>
      {sub && <p className="text-xs opacity-60">{sub}</p>}
    </div>
  )
  return href ? <Link href={href}>{card}</Link> : card
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      {children}
    </div>
  )
}

const ADMIN_QUICK_LINKS = [
  { label: 'Danh sách nhân viên', href: '/dashboard/personnel',       desc: 'Xem & thêm hồ sơ nhân viên' },
  { label: 'Quản lý phòng ban',   href: '/dashboard/departments',     desc: 'Sơ đồ & danh sách phòng ban' },
  { label: 'Chấm công hôm nay',   href: '/dashboard/attendance',      desc: 'Theo dõi check-in/out' },
  { label: 'Đơn nghỉ phép',       href: '/dashboard/attendance/leave',desc: 'Duyệt đơn đang chờ' },
]

function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({ queryKey: ['dashboard-stats'], queryFn: getDashboardStats, staleTime: 60_000 })
  const { data: attendance }       = useQuery({ queryKey: ['attendance-monthly-summary'], queryFn: getAttendanceMonthlySummary, staleTime: 60_000 })
  const { data: payrollTrend }     = useQuery({ queryKey: ['payroll-trend'], queryFn: getPayrollTrend, staleTime: 60_000 })
  const fmt = (n?: number) => isLoading ? '…' : (n ?? '—').toString()

  const employeeStatusData = stats ? [
    { name: 'Đang làm', value: stats.activeEmployees,     fill: '#3b82f6' },
    { name: 'Thử việc', value: stats.probationEmployees,  fill: '#f59e0b' },
    { name: 'Nghỉ phép', value: stats.onLeaveEmployees,   fill: '#8b5cf6' },
    { name: 'Đã nghỉ',  value: stats.terminatedEmployees, fill: '#ef4444' },
  ].filter(d => d.value > 0) : []

  const attendanceData = (attendance?.daily ?? []).slice(-14).map(d => ({
    date: d.date.slice(5), present: d.present, absent: d.absent,
  }))

  const payrollData = (payrollTrend ?? []).map(p => ({
    label: `${MONTHS[p.month - 1]}/${p.year}`,
    net:   Math.round(p.totalNet / 1_000_000),
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Tổng nhân viên" value={fmt(stats?.totalEmployees)} sub={`${fmt(stats?.activeEmployees)} đang làm`} href="/dashboard/personnel" color="blue" />
        <StatCard label="Thử việc"       value={fmt(stats?.probationEmployees)} color="yellow" />
        <StatCard label="Nghỉ dài hạn"   value={fmt(stats?.onLeaveEmployees)}   color="purple" />
        <StatCard label="Đã nghỉ việc"   value={fmt(stats?.terminatedEmployees)} color="red" />
        <StatCard label="Phòng ban"       value={fmt(stats?.totalDepartments)}   href="/dashboard/departments" color="gray" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ChartCard title="Cơ cấu nhân viên">
          {employeeStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={employeeStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {employeeStatusData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v} người`, '']} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">Chưa có dữ liệu</div>}
        </ChartCard>
        <ChartCard title={`Chấm công tháng ${attendance?.period ?? '...'}`}>
          {attendanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={attendanceData} barSize={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={2} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="present" name="Có mặt" fill="#3b82f6" radius={[3,3,0,0]} />
                <Bar dataKey="absent"  name="Vắng"   fill="#fca5a5" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">Chưa có dữ liệu</div>}
        </ChartCard>
        <ChartCard title="Tổng lương NET 6 tháng (triệu ₫)">
          {payrollData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={payrollData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} unit="M" />
                <Tooltip formatter={(v) => [`${v} triệu ₫`, 'Tổng NET']} labelFormatter={(l) => `Tháng ${l}`} />
                <Bar dataKey="net" name="NET (triệu)" fill="#10b981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">Chưa có dữ liệu</div>}
        </ChartCard>
      </div>
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Truy cập nhanh</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {ADMIN_QUICK_LINKS.map(l => (
            <Link key={l.href} href={l.href}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-md transition-all group">
              <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-700">{l.label}</p>
              <p className="text-xs text-gray-400 mt-1">{l.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Employee dashboard ─────────────────────────────────────────────────────────
type DayStatus = 'present' | 'late' | 'absent' | 'leave' | 'weekend' | 'holiday' | 'future' | 'today-empty'

function getDayStatus(
  dateStr: string,
  record: AttendanceRecord | undefined,
  leaves: LeaveRequest[],
  today: string,
): DayStatus {
  const d = new Date(dateStr)
  const dow = d.getDay()
  if (dow === 0 || dow === 6) return 'weekend' // CN + T7

  if (dateStr > today) return 'future'

  // check nghỉ phép approved
  const onLeave = leaves.some(l =>
    l.status === 'APPROVED' && l.startDate <= dateStr && l.endDate >= dateStr
  )
  if (onLeave) return 'leave'

  if (!record || record.status === 'ABSENT') {
    if (dateStr === today) return 'today-empty'
    return 'absent'
  }
  if (record.status === 'LATE') return 'late'
  return 'present'
}

const STATUS_STYLE: Record<DayStatus, string> = {
  present:     'bg-green-50 border-green-200',
  late:        'bg-yellow-50 border-yellow-200',
  absent:      'bg-red-50 border-red-200',
  leave:       'bg-blue-50 border-blue-200',
  weekend:     'bg-gray-50 border-gray-100',
  holiday:     'bg-purple-50 border-purple-200',
  future:      'bg-white border-gray-100',
  'today-empty': 'bg-orange-50 border-orange-200 ring-2 ring-orange-300',
}

const STATUS_DOT: Record<DayStatus, string> = {
  present:     'bg-green-500',
  late:        'bg-yellow-500',
  absent:      'bg-red-400',
  leave:       'bg-blue-400',
  weekend:     'bg-gray-300',
  holiday:     'bg-purple-400',
  future:      'bg-transparent',
  'today-empty': 'bg-orange-400',
}

const STATUS_LABEL: Record<DayStatus, string> = {
  present:     'Có mặt',
  late:        'Đi trễ',
  absent:      'Vắng',
  leave:       'Nghỉ phép',
  weekend:     'T7/CN',
  holiday:     'Nghỉ lễ',
  future:      '',
  'today-empty': 'Chưa chấm',
}

function SummaryChip({ label, value, sub, color }: {
  label: string; value: string | number; sub?: string
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'gray'
}) {
  const cls = {
    blue:   'bg-blue-600 text-white',
    green:  'bg-green-600 text-white',
    orange: 'bg-orange-500 text-white',
    purple: 'bg-purple-600 text-white',
    red:    'bg-red-500 text-white',
    gray:   'bg-gray-100 text-gray-700',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${cls[color]}`}>
        <span className="text-xl font-bold leading-none">{value}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function EmployeeDashboard() {
  const now   = new Date()
  const today = now.toISOString().slice(0, 10)
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const { data: me } = useCurrentEmployee()

  const { data: records = [], isLoading: loadingAtt } = useQuery({
    queryKey: ['monthly-report', me?.id, year, month],
    queryFn: () => getMonthlyReport(me!.id, year, month),
    enabled: !!me?.id,
  })

  const { data: leaves = [] } = useQuery({
    queryKey: ['my-leave', me?.id],
    queryFn: () => getMyLeaveRequests(me!.id),
    enabled: !!me?.id,
  })

  // Build record map by date
  const recordMap: Record<string, AttendanceRecord> = {}
  records.forEach(r => { recordMap[r.workDate] = r })

  // Generate all days in month
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDow    = new Date(year, month - 1, 1).getDay() // 0=Sun

  const allDays: string[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    allDays.push(`${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`)
  }

  // Summary stats
  const standardDays  = countStandardDays(year, month)
  const presentDays   = records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length
  const lateDays      = records.filter(r => r.status === 'LATE').length
  const absentDays    = allDays.filter(d => {
    if (d > today) return false
    const dow = new Date(d).getDay()
    if (dow === 0 || dow === 6) return false // bỏ CN + T7
    const onLeave = leaves.some(l => l.status === 'APPROVED' && l.startDate <= d && l.endDate >= d)
    if (onLeave) return false
    return !recordMap[d] || recordMap[d].status === 'ABSENT'
  }).length
  const leaveDays     = leaves.filter(l => l.status === 'APPROVED' && l.startDate.startsWith(`${year}-${String(month).padStart(2,'0')}`)).reduce((acc, l) => {
    const start = new Date(l.startDate), end = new Date(l.endDate)
    let cnt = 0
    const cur = new Date(start)
    while (cur <= end) { const dw = cur.getDay(); if (dw !== 0 && dw !== 6) cnt++; cur.setDate(cur.getDate()+1) }
    return acc + cnt
  }, 0)
  const pendingLeaves = leaves.filter(l => l.status === 'PENDING').length

  const totalMins = records.reduce((s, r) => s + (r.durationMinutes ?? 0), 0)
  const avgMins   = presentDays > 0 ? Math.round(totalMins / presentDays) : 0

  // Attendance rate %
  const workedSoFar = allDays.filter(d => {
    if (d > today) return false
    const dw = new Date(d).getDay(); return dw !== 0 && dw !== 6
  }).length
  const rate = workedSoFar > 0 ? Math.round((presentDays / workedSoFar) * 100) : 0

  // Today's record
  const todayRec = recordMap[today]

  // Navigate month
  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) } else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) } else setMonth(m => m + 1)
    }
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bảng công của tôi</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Chào mừng, <span className="font-semibold text-gray-700">{me?.fullName}</span>
            {me?.position && <span className="text-gray-400"> · {me.position}</span>}
          </p>
        </div>
        <Link href="/dashboard/attendance/leave"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
          </svg>
          Đơn nghỉ phép
        </Link>
      </div>

      {/* Today card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-blue-200 text-xs font-medium uppercase tracking-wide">Hôm nay</p>
            <p className="text-lg font-semibold mt-0.5">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-blue-200 text-xs">Check-in</p>
              <p className={`text-2xl font-bold mt-0.5 ${todayRec?.checkIn ? 'text-green-300' : 'text-blue-300'}`}>
                {fmtTime(todayRec?.checkIn) ?? '--:--'}
              </p>
            </div>
            <div className="w-px h-10 bg-blue-500" />
            <div className="text-center">
              <p className="text-blue-200 text-xs">Check-out</p>
              <p className={`text-2xl font-bold mt-0.5 ${todayRec?.checkOut ? 'text-green-300' : 'text-blue-300'}`}>
                {fmtTime(todayRec?.checkOut) ?? '--:--'}
              </p>
            </div>
            <div className="w-px h-10 bg-blue-500" />
            <div className="text-center">
              <p className="text-blue-200 text-xs">Thời gian làm</p>
              <p className="text-2xl font-bold mt-0.5 text-white">
                {fmtMinutes(todayRec?.durationMinutes) ?? '--'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <SummaryChip label="Ngày công thực tế" value={presentDays}
          sub={`/ ${standardDays} ngày chuẩn`} color="green" />
        <SummaryChip label="Tỷ lệ đi làm" value={`${rate}%`}
          sub={loadingAtt ? 'Đang tải…' : `${workedSoFar} ngày đã qua`} color="blue" />
        <SummaryChip label="Đi trễ" value={lateDays}
          sub="ngày trong tháng" color="orange" />
        <SummaryChip label="Vắng không phép" value={absentDays}
          sub="ngày trong tháng" color="red" />
        <SummaryChip label="Nghỉ phép" value={leaveDays}
          sub={pendingLeaves > 0 ? `${pendingLeaves} đơn đang chờ` : 'ngày đã duyệt'} color="purple" />
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Calendar header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <button onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
          </button>
          <div className="text-center">
            <p className="text-base font-bold text-gray-800">Tháng {month}/{year}</p>
            <p className="text-xs text-gray-400">Công chuẩn: {standardDays} ngày (trừ CN)</p>
          </div>
          <button onClick={nextMonth} disabled={isCurrentMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-30">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAY_LABELS.map((d, i) => (
            <div key={d} className={`py-2 text-center text-xs font-semibold ${
              i === 0 ? 'text-red-400' : 'text-gray-500'
            }`}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        {loadingAtt ? (
          <div className="h-64 flex items-center justify-center text-sm text-gray-400">Đang tải lịch công…</div>
        ) : (
          <div className="grid grid-cols-7 gap-px bg-gray-100">
            {/* Empty cells before first day */}
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-gray-50 min-h-[90px]" />
            ))}

            {allDays.map(dateStr => {
              const d = parseInt(dateStr.slice(8))
              const rec = recordMap[dateStr]
              const dow = new Date(dateStr).getDay()
              const status = getDayStatus(dateStr, rec, leaves, today)
              const isToday = dateStr === today
              const isSun = dow === 0

              return (
                <div key={dateStr}
                  className={`min-h-[90px] p-2 ${STATUS_STYLE[status]} border transition-colors`}>
                  {/* Date number */}
                  <div className="flex items-start justify-between mb-1">
                    <span className={`text-sm font-bold leading-none ${
                      isToday ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs' :
                      isSun ? 'text-red-400' : 'text-gray-700'
                    }`}>{d}</span>
                    {status !== 'future' && status !== 'weekend' && (
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${STATUS_DOT[status]}`} />
                    )}
                  </div>

                  {/* Check-in / Check-out */}
                  {rec?.checkIn && (
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-400 w-5">IN</span>
                        <span className={`text-[11px] font-semibold ${
                          status === 'late' ? 'text-yellow-700' : 'text-green-700'
                        }`}>{fmtTime(rec.checkIn)}</span>
                      </div>
                      {rec?.checkOut && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-gray-400 w-5">OUT</span>
                          <span className="text-[11px] font-semibold text-gray-600">{fmtTime(rec.checkOut)}</span>
                        </div>
                      )}
                      {rec?.durationMinutes && (
                        <div className="text-[10px] text-gray-400">{fmtMinutes(rec.durationMinutes)}</div>
                      )}
                    </div>
                  )}

                  {/* Status label when no record */}
                  {!rec?.checkIn && status !== 'future' && status !== 'present' && (
                    <span className={`text-[10px] font-medium block mt-0.5 ${
                      status === 'absent'      ? 'text-red-500' :
                      status === 'leave'       ? 'text-blue-600' :
                      status === 'weekend'     ? 'text-gray-400' :
                      status === 'today-empty' ? 'text-orange-600' :
                      'text-gray-400'
                    }`}>{STATUS_LABEL[status]}</span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 px-5 py-3 border-t border-gray-100 bg-gray-50/50">
          {([
            ['bg-green-500', 'Có mặt'],
            ['bg-yellow-500', 'Đi trễ'],
            ['bg-red-400',   'Vắng'],
            ['bg-blue-400',  'Nghỉ phép'],
            ['bg-gray-300',  'Thứ 7'],
          ] as const).map(([dot, label]) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Leave requests */}
      {leaves.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Đơn nghỉ phép gần đây</h3>
            <Link href="/dashboard/attendance/leave" className="text-xs text-blue-600 hover:underline">Xem tất cả →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {leaves.slice(0, 5).map(l => (
              <div key={l.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{LEAVE_TYPE_LABELS[l.leaveType]}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(l.startDate).toLocaleDateString('vi-VN')} → {new Date(l.endDate).toLocaleDateString('vi-VN')}
                    <span className="ml-2">· {l.totalDays} ngày</span>
                  </p>
                </div>
                <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  l.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                  l.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>{LEAVE_STATUS_LABELS[l.status]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page — route by role ──────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: session } = useSession()
  const role = session?.role as string | undefined

  const isManager = role === 'ADMIN' || role === 'HR_MANAGER'

  return (
    <div className="space-y-6">
      {isManager ? <AdminDashboard /> : <EmployeeDashboard />}
    </div>
  )
}
