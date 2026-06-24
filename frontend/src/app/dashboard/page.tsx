'use client'
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

const MONTHS = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12']

function StatCard({
  label, value, sub, href, color,
}: {
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

const QUICK_LINKS = [
  { label: 'Danh sách nhân viên', href: '/dashboard/personnel',    desc: 'Xem & thêm hồ sơ nhân viên' },
  { label: 'Quản lý phòng ban',   href: '/dashboard/departments',  desc: 'Sơ đồ & danh sách phòng ban' },
  { label: 'Chấm công hôm nay',   href: '/dashboard/attendance',   desc: 'Theo dõi check-in/out' },
  { label: 'Đơn nghỉ phép',       href: '/dashboard/attendance/leave', desc: 'Duyệt đơn đang chờ' },
]

export default function DashboardPage() {
  const { data: session } = useSession()
  const roles = session?.roles ?? []
  // Phase 1: bất kỳ user đăng nhập đều thấy stats
  const canViewStats = !!session

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    enabled: canViewStats,
    staleTime: 60_000,
  })

  const { data: attendance } = useQuery({
    queryKey: ['attendance-monthly-summary'],
    queryFn: getAttendanceMonthlySummary,
    enabled: canViewStats,
    staleTime: 60_000,
  })

  const { data: payrollTrend } = useQuery({
    queryKey: ['payroll-trend'],
    queryFn: getPayrollTrend,
    enabled: canViewStats,
    staleTime: 60_000,
  })

  const fmt = (n?: number) => (statsLoading ? '…' : (n ?? '—').toString())

  // Donut chart: trạng thái nhân viên
  const employeeStatusData = stats ? [
    { name: 'Đang làm', value: stats.activeEmployees,    fill: '#3b82f6' },
    { name: 'Thử việc', value: stats.probationEmployees, fill: '#f59e0b' },
    { name: 'Nghỉ phép', value: stats.onLeaveEmployees,  fill: '#8b5cf6' },
    { name: 'Đã nghỉ',  value: stats.terminatedEmployees,fill: '#ef4444' },
  ].filter(d => d.value > 0) : []

  // Bar chart: chấm công 14 ngày gần nhất
  const attendanceData = (attendance?.daily ?? []).slice(-14).map(d => ({
    date: d.date.slice(5), // MM-DD
    present: d.present,
    absent:  d.absent,
  }))

  // Bar chart: bảng lương 6 tháng
  const payrollData = (payrollTrend ?? []).map(p => ({
    label: `${MONTHS[p.month - 1]}/${p.year}`,
    net:   Math.round(p.totalNet / 1_000_000),
    count: p.count,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Tổng quan</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Chào mừng, <span className="font-medium">{session?.user?.name ?? session?.user?.email}</span>
        </p>
      </div>

      {canViewStats && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard label="Tổng nhân viên" value={fmt(stats?.totalEmployees)}
              sub={`${fmt(stats?.activeEmployees)} đang làm`} href="/dashboard/personnel" color="blue" />
            <StatCard label="Thử việc"   value={fmt(stats?.probationEmployees)} color="yellow" />
            <StatCard label="Nghỉ dài hạn" value={fmt(stats?.onLeaveEmployees)} color="purple" />
            <StatCard label="Đã nghỉ việc" value={fmt(stats?.terminatedEmployees)} color="red" />
            <StatCard label="Phòng ban"  value={fmt(stats?.totalDepartments)}
              href="/dashboard/departments" color="gray" />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Donut — Cơ cấu nhân viên */}
            <ChartCard title="Cơ cấu nhân viên">
              {employeeStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={employeeStatusData}
                      cx="50%" cy="50%"
                      innerRadius={55} outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {employeeStatusData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`${v} người`, '']} />
                    <Legend iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">Chưa có dữ liệu</div>
              )}
            </ChartCard>

            {/* Bar — Chấm công 14 ngày */}
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
              ) : (
                <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">Chưa có dữ liệu</div>
              )}
            </ChartCard>

            {/* Bar — Tổng lương NET 6 tháng */}
            <ChartCard title="Tổng lương NET 6 tháng (triệu ₫)">
              {payrollData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={payrollData} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} unit="M" />
                    <Tooltip
                      formatter={(v: number) => [`${v} triệu ₫`, 'Tổng NET']}
                      labelFormatter={(l) => `Tháng ${l}`}
                    />
                    <Bar dataKey="net" name="NET (triệu)" fill="#10b981" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">Chưa có dữ liệu</div>
              )}
            </ChartCard>
          </div>
        </>
      )}

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Truy cập nhanh</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_LINKS.map(l => (
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
