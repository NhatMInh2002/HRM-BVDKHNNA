'use client'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { getDashboardStats } from '@/lib/dashboard'

function StatCard({
  label, value, sub, href, color,
}: {
  label: string
  value: string | number
  sub?: string
  href?: string
  color: 'blue' | 'green' | 'yellow' | 'red' | 'gray'
}) {
  const colors = {
    blue:   'bg-blue-50 border-blue-200 text-blue-700',
    green:  'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    red:    'bg-red-50 border-red-200 text-red-700',
    gray:   'bg-gray-50 border-gray-200 text-gray-600',
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

const QUICK_LINKS = [
  { label: 'Thêm nhân viên', href: '/dashboard/personnel', desc: 'Tạo hồ sơ nhân viên mới' },
  { label: 'Sơ đồ tổ chức', href: '/dashboard/org-chart', desc: 'Xem cây phòng ban' },
  { label: 'Chấm công hôm nay', href: '/dashboard/attendance', desc: 'Theo dõi check-in/out' },
  { label: 'Đơn nghỉ phép', href: '/dashboard/attendance/leave', desc: 'Duyệt đơn đang chờ' },
]

export default function DashboardPage() {
  const { data: session } = useSession()
  const roles = session?.roles ?? []
  const canViewStats = roles.some(r => ['ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'].includes(r))

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    enabled: canViewStats,
    staleTime: 60_000,
  })

  const fmt = (n?: number) => (isLoading ? '…' : (n ?? '—').toString())

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Tổng quan</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Chào mừng, <span className="font-medium">{session?.user?.name ?? session?.user?.email}</span>
        </p>
      </div>

      {/* Stat cards */}
      {canViewStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Tổng nhân viên"
            value={fmt(stats?.totalEmployees)}
            sub={`${fmt(stats?.activeEmployees)} đang làm việc`}
            href="/dashboard/personnel"
            color="blue"
          />
          <StatCard
            label="Thử việc"
            value={fmt(stats?.probationEmployees)}
            sub="đang trong thời gian thử việc"
            color="yellow"
          />
          <StatCard
            label="Đã nghỉ việc"
            value={fmt(stats?.terminatedEmployees)}
            color="red"
          />
          <StatCard
            label="Phòng ban"
            value={fmt(stats?.totalDepartments)}
            sub="đơn vị trong bệnh viện"
            href="/dashboard/org-chart"
            color="gray"
          />
        </div>
      )}

      {/* Quick links */}
      <div className="mb-2">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Truy cập nhanh</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-md transition-all group"
            >
              <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-700">{l.label}</p>
              <p className="text-xs text-gray-400 mt-1">{l.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
