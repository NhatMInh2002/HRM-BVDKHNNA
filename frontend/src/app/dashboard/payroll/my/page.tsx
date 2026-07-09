'use client'
import { useQuery } from '@tanstack/react-query'
import { myPayroll, PAYROLL_STATUS_LABELS, PAYROLL_STATUS_COLORS, type PayrollRecord } from '@/lib/payroll'
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee'
import { downloadPayslipPdf } from '@/lib/payroll'

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

function StatusBadge({ status }: { status: PayrollRecord['status'] }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PAYROLL_STATUS_COLORS[status]}`}>
      {PAYROLL_STATUS_LABELS[status]}
    </span>
  )
}

const MONTHS = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
                'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12']

export default function MyPayrollPage() {
  const { data: me, isLoading: loadingMe } = useCurrentEmployee()

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['my-payroll', me?.id],
    queryFn: () => myPayroll(me!.id),
    enabled: !!me?.id,
    staleTime: 5 * 60_000,
  })

  if (loadingMe || isLoading) {
    return <div className="text-gray-400 text-sm p-8 text-center">Đang tải...</div>
  }

  if (!me) {
    return (
      <div className="text-gray-500 text-sm p-8 text-center">
        Tài khoản chưa được liên kết với hồ sơ nhân viên.<br/>
        Vui lòng liên hệ Phòng Tổ chức cán bộ.
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Lương cá nhân</h1>
        <p className="text-sm text-gray-500 mt-0.5">{me.fullName} · {me.employeeCode}</p>
      </div>

      {records.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 text-sm">
          Chưa có dữ liệu lương. Liên hệ Phòng Tổ chức cán bộ để biết thêm.
        </div>
      ) : (
        <div className="space-y-4">
          {records
            .sort((a, b) => b.periodYear * 100 + b.periodMonth - (a.periodYear * 100 + a.periodMonth))
            .map(rec => (
              <div key={rec.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {/* Month header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-semibold text-gray-800">
                      {MONTHS[rec.periodMonth - 1]} {rec.periodYear}
                    </span>
                    <StatusBadge status={rec.status} />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-blue-700">{fmt(rec.netSalary)}</span>
                    {rec.status !== 'DRAFT' && (
                      <button
                        onClick={() => downloadPayslipPdf(rec.id)}
                        className="text-xs text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-300 px-3 py-1.5 rounded transition-colors"
                      >
                        ↓ Phiếu lương PDF
                      </button>
                    )}
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-0 divide-x divide-y divide-gray-100">
                  <Row label="Lương cơ bản"       value={fmt(rec.basicSalary)} />
                  <Row label="Phụ cấp"             value={fmt(rec.totalAllowance)} />
                  <Row label="Tăng ca"             value={fmt(rec.otPay)} highlight={rec.otPay > 0} />
                  <Row label="Thu nhập tăng thêm"  value={fmt(rec.salaryIncrement)} highlight={rec.salaryIncrement > 0} />
                  <Row label="Lương gộp"           value={fmt(rec.grossSalary)} bold />
                  <Row label="BHXH (8%)"           value={`- ${fmt(rec.bhxhEmployee)}`} red />
                  <Row label="BHYT (1.5%)"         value={`- ${fmt(rec.bhytEmployee)}`} red />
                  <Row label="BHTN (1%)"           value={`- ${fmt(rec.bhtnEmployee)}`} red />
                  <Row label="Thuế TNCN"           value={`- ${fmt(rec.pit)}`} red />
                  <Row label="Khấu trừ khác"       value={`- ${fmt(rec.otherDeduction)}`} red />
                  <Row label="Ngày công chuẩn"     value={`${rec.workingDays} ngày`} />
                  <Row label="Ngày công thực tế"   value={`${rec.actualDays} ngày`} />
                  <Row label="Giờ tăng ca"         value={`${rec.otHours}h`} />
                </div>

                {/* Net total */}
                <div className="flex items-center justify-between px-5 py-3 bg-blue-50 border-t border-blue-100">
                  <span className="text-sm font-medium text-blue-700">Thực nhận</span>
                  <span className="text-xl font-bold text-blue-700">{fmt(rec.netSalary)}</span>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

function Row({
  label, value, bold, red, highlight,
}: {
  label: string
  value: string
  bold?: boolean
  red?: boolean
  highlight?: boolean
}) {
  return (
    <div className="px-4 py-2.5">
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className={`text-sm font-medium ${
        red ? 'text-red-600' : highlight ? 'text-orange-600' : bold ? 'text-gray-900 font-semibold' : 'text-gray-700'
      }`}>
        {value}
      </p>
    </div>
  )
}
