'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { searchEmployees } from '@/lib/personnel'
import { saveSalaryConfig, getSalaryHistory, SalaryConfig } from '@/lib/payroll'

const schema = z.object({
  employeeId: z.string().uuid('Chọn nhân viên'),
  basicSalary: z.coerce.number().min(1, 'Nhập lương cơ bản'),
  allowanceFood: z.coerce.number().min(0).default(0),
  allowanceTransport: z.coerce.number().min(0).default(0),
  allowancePhone: z.coerce.number().min(0).default(0),
  allowanceOther: z.coerce.number().min(0).default(0),
  coefficient: z.coerce.number().min(0.01).default(1),
  effectiveFrom: z.string().min(1, 'Chọn ngày áp dụng'),
})
type FormData = z.infer<typeof schema>

const fmtNum = (n: number) =>
  new Intl.NumberFormat('vi-VN').format(n)

export default function SalaryConfigPage() {
  const qc = useQueryClient()
  const [empSearch, setEmpSearch] = useState('')
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null)

  const { data: employees } = useQuery({
    queryKey: ['employees-search', empSearch],
    queryFn: () => searchEmployees({ keyword: empSearch, page: 0, size: 20 }),
    enabled: empSearch.length >= 2,
  })

  const { data: history } = useQuery({
    queryKey: ['salary-history', selectedEmpId],
    queryFn: () => getSalaryHistory(selectedEmpId!),
    enabled: !!selectedEmpId,
  })

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { coefficient: 1, allowanceFood: 0, allowanceTransport: 0, allowancePhone: 0, allowanceOther: 0 },
  })

  const saveMut = useMutation({
    mutationFn: saveSalaryConfig,
    onSuccess: () => {
      alert('Đã lưu cấu hình lương')
      qc.invalidateQueries({ queryKey: ['salary-history', selectedEmpId] })
    },
  })

  const onSubmit = (data: FormData) => saveMut.mutate(data)

  const basic = watch('basicSalary') || 0
  const coeff = watch('coefficient') || 1
  const food = watch('allowanceFood') || 0
  const transport = watch('allowanceTransport') || 0
  const phone = watch('allowancePhone') || 0
  const other = watch('allowanceOther') || 0
  const gross = basic * coeff + food + transport + phone + other

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Cấu hình lương</h1>
        <p className="text-sm text-gray-500 mt-0.5">Thiết lập lương cơ bản và phụ cấp cho nhân viên</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">

        {/* Employee picker */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">Nhân viên</label>
          <input
            type="text"
            placeholder="Tìm tên hoặc mã nhân viên…"
            value={empSearch}
            onChange={e => setEmpSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2"
          />
          {employees?.content?.length ? (
            <div className="border border-gray-200 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
              {employees.content.map(emp => (
                <div
                  key={emp.id}
                  onClick={() => {
                    setSelectedEmpId(emp.id)
                    setValue('employeeId', emp.id)
                    setEmpSearch(`${emp.fullName} (${emp.employeeCode})`)
                  }}
                  className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
                >
                  <span className="font-medium">{emp.fullName}</span>
                  <span className="text-gray-400 ml-2">{emp.employeeCode}</span>
                  {emp.position && <span className="text-gray-400 ml-2">— {emp.position}</span>}
                </div>
              ))}
            </div>
          ) : null}
          {errors.employeeId && <p className="text-red-500 text-xs mt-1">{errors.employeeId.message}</p>}
        </div>

        {/* Salary fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Lương cơ bản (VND)</label>
            <input type="number" {...register('basicSalary')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            {errors.basicSalary && <p className="text-red-500 text-xs mt-1">{errors.basicSalary.message}</p>}
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Hệ số lương</label>
            <input type="number" step="0.01" {...register('coefficient')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        {/* Allowances */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Phụ cấp (VND/tháng)</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Ăn trưa', name: 'allowanceFood' as const },
              { label: 'Đi lại', name: 'allowanceTransport' as const },
              { label: 'Điện thoại', name: 'allowancePhone' as const },
              { label: 'Khác', name: 'allowanceOther' as const },
            ].map(f => (
              <div key={f.name}>
                <label className="text-xs text-gray-500 block mb-1">{f.label}</label>
                <input type="number" {...register(f.name)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Gross preview */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm">
          <span className="text-blue-600 font-semibold">Dự kiến gross: </span>
          <span className="text-blue-800 font-bold text-base">{fmtNum(gross)} ₫</span>
        </div>

        {/* Effective date */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">Ngày áp dụng</label>
          <input type="date" {...register('effectiveFrom')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          {errors.effectiveFrom && <p className="text-red-500 text-xs mt-1">{errors.effectiveFrom.message}</p>}
        </div>

        <button
          type="submit"
          disabled={saveMut.isPending}
          className="bg-blue-600 text-white text-sm font-semibold px-6 py-2 rounded-lg
                     hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saveMut.isPending ? 'Đang lưu…' : 'Lưu cấu hình'}
        </button>
      </form>

      {/* History */}
      {history && history.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
            Lịch sử lương
          </h2>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Áp dụng từ</th>
                  <th className="px-4 py-3 text-right">Lương CB</th>
                  <th className="px-4 py-3 text-right">Hệ số</th>
                  <th className="px-4 py-3 text-right">Phụ cấp</th>
                  <th className="px-4 py-3 text-right">Gross dự kiến</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((c: SalaryConfig) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{c.effectiveFrom}</td>
                    <td className="px-4 py-3 text-right">{fmtNum(c.basicSalary)}</td>
                    <td className="px-4 py-3 text-right">{c.coefficient}</td>
                    <td className="px-4 py-3 text-right">{fmtNum(c.totalAllowance)}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {fmtNum(c.basicSalary * c.coefficient + c.totalAllowance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
