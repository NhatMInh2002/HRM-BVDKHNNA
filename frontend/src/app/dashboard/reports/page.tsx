'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Overview {
  headcount: { active_employees: number; probation_employees: number; terminated_employees: number; total_employees: number }
  payroll:   { payroll_count: number; total_gross: number; total_net: number; total_cost: number; approved_count: number; paid_count: number }
  attendance: { employees_recorded: number; total_check_ins: number; late_count: number }
  leave:     { total_requests: number; pending_count: number; approved_count: number; approved_days: number }
  contracts: { expiring_90d: number; expiring_30d: number }
  period:    { year: number; month: number }
}
interface DeptRow { dept_name: string; dept_code: string; [k: string]: unknown }

// ── Helpers ───────────────────────────────────────────────────────────────────
const MONTHS = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
                'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12']
const fmt  = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n ?? 0))
const fmtM = (n: number) => {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + ' tỷ'
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(0) + ' triệu'
  return fmt(n)
}
const num = (v: unknown) => Number(v ?? 0)

function StatCard({ icon, label, value, sub, color }: {
  icon: string; label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function BarChart({ data, labelKey, valueKey, color = '#3b82f6', label }: {
  data: DeptRow[]; labelKey: string; valueKey: string; color?: string; label: string
}) {
  if (!data.length) return <div className="text-center text-gray-400 text-sm py-8">Không có dữ liệu</div>
  const max = Math.max(...data.map(d => num(d[valueKey])), 1)
  return (
    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
      {data.map((row, i) => {
        const val = num(row[valueKey])
        const pct = Math.round((val / max) * 100)
        return (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-28 text-right text-gray-600 truncate flex-shrink-0" title={String(row[labelKey])}>
              {String(row[labelKey])}
            </div>
            <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
              <div className="h-full rounded-full flex items-center pl-2 text-white font-medium text-[10px]"
                style={{ width: `${pct}%`, backgroundColor: color, minWidth: val > 0 ? '2rem' : 0 }}>
                {pct > 15 ? fmt(val) : ''}
              </div>
            </div>
            {pct <= 15 && <span className="text-gray-500 w-16 text-right">{fmt(val)}</span>}
          </div>
        )
      })}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const now = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [tab,   setTab]   = useState<'headcount'|'payroll'|'attendance'|'leave'>('headcount')

  const { data: overview, isLoading: loadOv } = useQuery<Overview>({
    queryKey: ['report-overview', year, month],
    queryFn: () => apiFetch(`/report/overview?year=${year}&month=${month}`),
  })

  const { data: headcount = [] } = useQuery<DeptRow[]>({
    queryKey: ['report-headcount'],
    queryFn: () => apiFetch('/report/headcount'),
  })

  const { data: payrollCost = [] } = useQuery<DeptRow[]>({
    queryKey: ['report-payroll', year, month],
    queryFn: () => apiFetch(`/report/payroll-cost?year=${year}&month=${month}`),
    enabled: tab === 'payroll',
  })

  const { data: attendanceSummary = [] } = useQuery<DeptRow[]>({
    queryKey: ['report-attendance', year, month],
    queryFn: () => apiFetch(`/report/attendance-summary?year=${year}&month=${month}`),
    enabled: tab === 'attendance',
  })

  const { data: leaveBalance = [] } = useQuery<DeptRow[]>({
    queryKey: ['report-leave-balance', year],
    queryFn: () => apiFetch(`/report/leave-balance?year=${year}`),
    enabled: tab === 'leave',
  })

  const hc  = overview?.headcount
  const pay = overview?.payroll
  const att = overview?.attendance
  const lv  = overview?.leave
  const ct  = overview?.contracts

  const TABS = [
    { key: 'headcount',  label: '👥 Nhân sự' },
    { key: 'payroll',    label: '💰 Chi phí lương' },
    { key: 'attendance', label: '📅 Chuyên cần' },
    { key: 'leave',      label: '🏖️ Số dư phép' },
  ] as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Báo cáo & Thống kê</h1>
          <p className="text-sm text-gray-500 mt-1">Tổng hợp nhân sự, lương, chuyên cần theo kỳ</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
            {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      {loadOv ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse"/>)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon="👥" label="Đang làm việc"
            value={num(hc?.active_employees)}
            sub={`Thử việc: ${num(hc?.probation_employees)} | Nghỉ: ${num(hc?.terminated_employees)}`}
            color="bg-blue-100" />
          <StatCard icon="💵" label="Tổng gross kỳ này"
            value={fmtM(num(pay?.total_gross))}
            sub={`${num(pay?.payroll_count)} phiếu lương · Net: ${fmtM(num(pay?.total_net))}`}
            color="bg-green-100" />
          <StatCard icon="✅" label="Chấm công tháng"
            value={num(att?.total_check_ins)}
            sub={`Đi muộn: ${num(att?.late_count)} lượt`}
            color="bg-indigo-100" />
          <StatCard icon="📋" label="Đơn nghỉ phép"
            value={num(lv?.total_requests)}
            sub={`Chờ duyệt: ${num(lv?.pending_count)} | Đã duyệt: ${num(lv?.approved_days)} ngày`}
            color="bg-orange-100" />
          <StatCard icon="💰" label="Tổng chi phí NSD"
            value={fmtM(num(pay?.total_cost))}
            sub="Bao gồm BHXH/BHYT/BHTN chủ sử dụng"
            color="bg-purple-100" />
          <StatCard icon="✔️" label="Đã duyệt lương"
            value={num(pay?.approved_count) + num(pay?.paid_count)}
            sub={`Đã trả: ${num(pay?.paid_count)} phiếu`}
            color="bg-teal-100" />
          <StatCard icon="⚠️" label="Hợp đồng sắp hết"
            value={num(ct?.expiring_30d)}
            sub={`Trong 30 ngày tới (90 ngày: ${num(ct?.expiring_90d)})`}
            color="bg-yellow-100" />
          <StatCard icon="📆" label="Ngày phép đã dùng"
            value={num(lv?.approved_days)}
            sub={`Kỳ ${MONTHS[month - 1]} ${year}`}
            color="bg-red-100" />
        </div>
      )}

      {/* Tab charts */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex border-b border-gray-100">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'border-b-2 border-blue-600 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'headcount' && (
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Nhân sự theo phòng ban</h3>
                <BarChart data={headcount} labelKey="dept_name" valueKey="active"
                  label="Đang làm việc" color="#3b82f6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Bảng chi tiết</h3>
                <div className="overflow-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-500 border-b border-gray-100">
                        <th className="pb-2 text-left">Phòng ban</th>
                        <th className="pb-2 text-right">Đang làm</th>
                        <th className="pb-2 text-right">Thử việc</th>
                        <th className="pb-2 text-right">HĐ vô thời hạn</th>
                      </tr>
                    </thead>
                    <tbody>
                      {headcount.map((row, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2 font-medium text-gray-700">{row.dept_name}</td>
                          <td className="py-2 text-right text-blue-700 font-semibold">{num(row.active)}</td>
                          <td className="py-2 text-right text-yellow-600">{num(row.probation)}</td>
                          <td className="py-2 text-right text-gray-500">{num(row.indefinite)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-bold text-gray-900 border-t border-gray-200">
                        <td className="pt-2">Tổng</td>
                        <td className="pt-2 text-right text-blue-700">
                          {headcount.reduce((s, r) => s + num(r.active), 0)}
                        </td>
                        <td className="pt-2 text-right text-yellow-600">
                          {headcount.reduce((s, r) => s + num(r.probation), 0)}
                        </td>
                        <td className="pt-2 text-right text-gray-500">
                          {headcount.reduce((s, r) => s + num(r.indefinite), 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'payroll' && (
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Gross lương theo phòng ban</h3>
                <BarChart data={payrollCost} labelKey="dept_name" valueKey="total_gross"
                  label="Gross" color="#10b981" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Chi tiết chi phí</h3>
                <div className="overflow-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-500 border-b border-gray-100">
                        <th className="pb-2 text-left">Phòng ban</th>
                        <th className="pb-2 text-right">NV</th>
                        <th className="pb-2 text-right">Gross</th>
                        <th className="pb-2 text-right">Net</th>
                        <th className="pb-2 text-right">CP NSD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payrollCost.map((row, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2 font-medium text-gray-700 max-w-[120px] truncate">{row.dept_name}</td>
                          <td className="py-2 text-right text-gray-500">{num(row.employee_count)}</td>
                          <td className="py-2 text-right text-green-700 font-semibold">{fmtM(num(row.total_gross))}</td>
                          <td className="py-2 text-right text-blue-700">{fmtM(num(row.total_net))}</td>
                          <td className="py-2 text-right text-purple-600">{fmtM(num(row.total_employer_cost))}</td>
                        </tr>
                      ))}
                    </tbody>
                    {payrollCost.length > 0 && (
                      <tfoot>
                        <tr className="font-bold text-gray-900 border-t border-gray-200">
                          <td className="pt-2">Tổng</td>
                          <td className="pt-2 text-right">{payrollCost.reduce((s,r)=>s+num(r.employee_count),0)}</td>
                          <td className="pt-2 text-right text-green-700">{fmtM(payrollCost.reduce((s,r)=>s+num(r.total_gross),0))}</td>
                          <td className="pt-2 text-right text-blue-700">{fmtM(payrollCost.reduce((s,r)=>s+num(r.total_net),0))}</td>
                          <td className="pt-2 text-right text-purple-600">{fmtM(payrollCost.reduce((s,r)=>s+num(r.total_employer_cost),0))}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                  {payrollCost.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-8">Chưa có dữ liệu lương kỳ {MONTHS[month-1]} {year}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'attendance' && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Chuyên cần theo phòng ban — {MONTHS[month-1]} {year}</h3>
              <div className="overflow-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-100">
                      <th className="pb-2 text-left">Phòng ban</th>
                      <th className="pb-2 text-right">Nhân viên</th>
                      <th className="pb-2 text-right">Lượt chấm công</th>
                      <th className="pb-2 text-right">Tỉ lệ có mặt %</th>
                      <th className="pb-2 text-right">Đi muộn</th>
                      <th className="pb-2 text-right">Ngày nghỉ phép</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceSummary.map((row, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 font-medium text-gray-700">{row.dept_name}</td>
                        <td className="py-2 text-right text-gray-500">{num(row.total_employees)}</td>
                        <td className="py-2 text-right text-blue-700">{num(row.total_records)}</td>
                        <td className="py-2 text-right">
                          <span className={`font-semibold ${num(row.checkin_rate_pct) >= 90 ? 'text-green-600' : num(row.checkin_rate_pct) >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {num(row.checkin_rate_pct)}%
                          </span>
                        </td>
                        <td className="py-2 text-right text-orange-600">{num(row.late_count)}</td>
                        <td className="py-2 text-right text-purple-600">{num(row.leave_days_used)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {attendanceSummary.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-8">Chưa có dữ liệu chấm công kỳ {MONTHS[month-1]} {year}</p>
                )}
              </div>
            </div>
          )}

          {tab === 'leave' && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Số dư phép năm {year}</h3>
              <div className="overflow-auto max-h-[420px]">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-white">
                    <tr className="text-gray-500 border-b border-gray-100">
                      <th className="pb-2 text-left">Mã NV</th>
                      <th className="pb-2 text-left">Họ tên</th>
                      <th className="pb-2 text-left">Phòng ban</th>
                      <th className="pb-2 text-right">Thâm niên</th>
                      <th className="pb-2 text-right">Định mức</th>
                      <th className="pb-2 text-right">Đã dùng</th>
                      <th className="pb-2 text-right">Còn lại</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveBalance.map((row, i) => {
                      const remaining = num(row.annual_remaining)
                      return (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-1.5 font-mono text-gray-500">{String(row.employee_code)}</td>
                          <td className="py-1.5 font-medium text-gray-800">{String(row.full_name)}</td>
                          <td className="py-1.5 text-gray-500 max-w-[120px] truncate">{String(row.dept_name ?? '')}</td>
                          <td className="py-1.5 text-right text-gray-500">{num(row.years_of_service)} năm</td>
                          <td className="py-1.5 text-right text-gray-700">{num(row.annual_entitlement)}</td>
                          <td className="py-1.5 text-right text-orange-600">{num(row.annual_used)}</td>
                          <td className="py-1.5 text-right">
                            <span className={`font-bold ${remaining <= 0 ? 'text-red-600' : remaining <= 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                              {remaining}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {leaveBalance.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-8">Không có dữ liệu</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
