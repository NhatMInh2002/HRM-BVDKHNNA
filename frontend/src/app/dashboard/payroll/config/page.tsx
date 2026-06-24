'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { searchEmployees, getDepartments, Employee } from '@/lib/personnel'
import { saveSalaryConfig, getSalaryHistory, SalaryConfig } from '@/lib/payroll'

// ── Schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
  basicSalary:        z.coerce.number().min(1_000_000, 'Tối thiểu 1,000,000 ₫').max(100_000_000),
  coefficient:        z.coerce.number().min(1.0, 'Tối thiểu 1.00').max(10.0, 'Tối đa 10.00').default(1),
  allowanceFood:      z.coerce.number().min(0).default(0),
  allowanceTransport: z.coerce.number().min(0).default(0),
  allowancePhone:     z.coerce.number().min(0).default(0),
  allowancePosition:  z.coerce.number().min(0).default(0),
  allowanceSeniority: z.coerce.number().min(0).default(0),
  allowanceHouse:     z.coerce.number().min(0).default(0),
  allowanceOther:     z.coerce.number().min(0).default(0),
  allowanceToxic:     z.coerce.number().min(0).default(0),
  dependents:         z.coerce.number().int().min(0).max(10).default(0),
  bhxhExempt:         z.boolean().default(false),
  effectiveFrom:      z.string().min(1, 'Chọn ngày áp dụng'),
})
type FormData = z.infer<typeof schema>

// ── Constants ─────────────────────────────────────────────────────────────────
const COEFFICIENT_PRESETS = [
  { label: '1.00 — Nhân viên mới / thử việc', value: 1.00 },
  { label: '1.35 — Nhân viên bậc 1',          value: 1.35 },
  { label: '1.68 — Nhân viên bậc 2',          value: 1.68 },
  { label: '2.06 — Nhân viên bậc 3',          value: 2.06 },
  { label: '2.49 — Nhân viên bậc 4',          value: 2.49 },
  { label: '2.97 — Nhân viên bậc 5',          value: 2.97 },
  { label: '3.50 — Chuyên viên / kỹ sư',      value: 3.50 },
  { label: '4.00 — Chuyên viên chính',         value: 4.00 },
  { label: '4.98 — Phó trưởng phòng',         value: 4.98 },
  { label: '5.76 — Trưởng phòng',             value: 5.76 },
  { label: '6.56 — Phó giám đốc',             value: 6.56 },
  { label: '7.55 — Giám đốc bệnh viện',       value: 7.55 },
]

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n))

function calcPit(taxable: number) {
  if (taxable <= 0) return 0
  const thresholds = [0, 5e6, 10e6, 18e6, 32e6, 52e6, 80e6]
  const uppers     = [5e6, 10e6, 18e6, 32e6, 52e6, 80e6, Infinity]
  const rates      = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35]
  let tax = 0
  for (let i = 0; i < rates.length; i++) {
    if (taxable <= thresholds[i]) break
    tax += (Math.min(taxable, uppers[i]) - thresholds[i]) * rates[i]
  }
  return Math.round(tax)
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Field({ label, note, hint, error, children }: {
  label: string; note?: React.ReactNode; hint?: string; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-700 block mb-1">
        {label}
        {note && <span className="ml-1.5 font-normal">{note}</span>}
      </label>
      {children}
      {hint  && !error && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-0.5">⚠ {error}</p>}
    </div>
  )
}

function NumInput({ register, name, placeholder, step = '1000', min = '0' }: {
  register: ReturnType<typeof useForm<FormData>>['register']
  name: keyof FormData; placeholder?: string; step?: string; min?: string
}) {
  return (
    <input type="number" step={step} min={min} placeholder={placeholder}
      {...register(name as any)}
      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm
                 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
  )
}

function Row({ label, value, bold, bigValue, color, note }: {
  label: string; value: string | number; bold?: boolean; bigValue?: boolean
  color?: string; note?: string
}) {
  return (
    <div className="flex justify-between items-baseline gap-2">
      <span className={`text-gray-600 ${bold ? 'font-semibold text-gray-800' : ''}`}>
        {label}
        {note && <span className="ml-1 text-xs text-gray-400">({note})</span>}
      </span>
      <span className={`tabular-nums ${bold ? 'font-bold' : 'font-medium'} ${bigValue ? 'text-base' : ''} ${color ?? 'text-gray-800'}`}>
        {value}
      </span>
    </div>
  )
}

// ── Employee tag chip ─────────────────────────────────────────────────────────
function EmpChip({ emp, onRemove }: { emp: Employee; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-800
                     text-xs font-medium px-2.5 py-1 rounded-full">
      {emp.fullName}
      <span className="text-blue-400 font-mono text-[10px]">{emp.employeeCode}</span>
      <button type="button" onClick={onRemove}
        className="ml-0.5 text-blue-400 hover:text-red-500 transition-colors leading-none">✕</button>
    </span>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
type SelectMode = 'individual' | 'department'

export default function SalaryConfigPage() {
  const qc = useQueryClient()

  // ── Employee / group selection state ────────────────────────────────────
  const [mode, setMode] = useState<SelectMode>('individual')

  // individual mode
  const [empSearch, setEmpSearch] = useState('')
  const [showList, setShowList]   = useState(false)

  // shared: selected employees (works for both modes)
  const [selectedEmps, setSelectedEmps] = useState<Employee[]>([])

  // department mode
  const [deptId, setDeptId]           = useState('')
  const [checkedIds, setCheckedIds]   = useState<Set<string>>(new Set())

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
  })

  const { data: empSearch_results } = useQuery({
    queryKey: ['employees-search', empSearch],
    queryFn: () => searchEmployees({ keyword: empSearch, page: 0, size: 20 }),
    enabled: mode === 'individual' && empSearch.length >= 2,
  })

  const { data: deptEmployees } = useQuery({
    queryKey: ['employees-by-dept', deptId],
    queryFn: () => searchEmployees({ departmentId: deptId, status: 'ACTIVE', page: 0, size: 100 }),
    enabled: mode === 'department' && deptId !== '',
  })

  // first selected emp for history display
  const firstEmpId = selectedEmps[0]?.id ?? null
  const { data: history } = useQuery({
    queryKey: ['salary-history', firstEmpId],
    queryFn: () => getSalaryHistory(firstEmpId!),
    enabled: !!firstEmpId && selectedEmps.length === 1,
  })

  // ── Form ────────────────────────────────────────────────────────────────
  const [coeffMode, setCoeffMode] = useState<'preset' | 'manual'>('preset')

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      coefficient: 1, dependents: 0, bhxhExempt: false,
      allowanceFood: 0, allowanceTransport: 0, allowancePhone: 0,
      allowancePosition: 0, allowanceSeniority: 0, allowanceHouse: 0,
      allowanceToxic: 0, allowanceOther: 0,
    },
  })

  // ── Batch save mutation ──────────────────────────────────────────────────
  const [batchResult, setBatchResult] = useState<{ ok: number; fail: number } | null>(null)
  const [saving, setSaving] = useState(false)

  const onSubmit = async (data: FormData) => {
    if (selectedEmps.length === 0) {
      alert('Vui lòng chọn ít nhất 1 nhân viên')
      return
    }
    setSaving(true)
    setBatchResult(null)
    let ok = 0, fail = 0
    await Promise.allSettled(
      selectedEmps.map(emp =>
        saveSalaryConfig({ ...data, employeeId: emp.id })
          .then(() => ok++)
          .catch(() => fail++)
      )
    )
    setSaving(false)
    setBatchResult({ ok, fail })
    if (ok > 0) qc.invalidateQueries({ queryKey: ['salary-history'] })
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  const addEmp = (emp: Employee) => {
    if (!selectedEmps.find(e => e.id === emp.id))
      setSelectedEmps(prev => [...prev, emp])
  }
  const removeEmp = (id: string) => setSelectedEmps(prev => prev.filter(e => e.id !== id))

  const toggleDeptEmp = (emp: Employee) => {
    const next = new Set(checkedIds)
    if (next.has(emp.id)) next.delete(emp.id)
    else next.add(emp.id)
    setCheckedIds(next)
    // sync selectedEmps from dept list
    const deptList = deptEmployees?.content ?? []
    setSelectedEmps(deptList.filter(e => next.has(e.id)))
  }

  const toggleAllDept = () => {
    const all = deptEmployees?.content ?? []
    if (checkedIds.size === all.length) {
      setCheckedIds(new Set())
      setSelectedEmps([])
    } else {
      const ids = new Set(all.map(e => e.id))
      setCheckedIds(ids)
      setSelectedEmps(all)
    }
  }

  // ── Live salary preview ──────────────────────────────────────────────────
  const w = watch()
  const baseFull   = (w.basicSalary || 0) * (w.coefficient || 1)
  const food       = w.allowanceFood || 0
  const foodExempt = Math.min(food, 730_000)
  const foodTax    = Math.max(food - 730_000, 0)
  const taxExempt  = foodExempt + (w.allowanceToxic || 0)
  const taxableAlw = foodTax + (w.allowanceTransport || 0) + (w.allowancePhone || 0)
                   + (w.allowancePosition || 0) + (w.allowanceSeniority || 0)
                   + (w.allowanceHouse || 0) + (w.allowanceOther || 0)
  const gross      = baseFull + taxableAlw + taxExempt
  const exempt     = w.bhxhExempt || false
  const bhxhBase   = exempt ? 0 : Math.min(baseFull, 46_800_000)
  const bhtnBase   = exempt ? 0 : Math.min(baseFull, 72_800_000)
  const bhxh       = Math.round(bhxhBase * 0.08)
  const bhyt       = Math.round(bhxhBase * 0.015)
  const bhtn       = Math.round(bhtnBase * 0.01)
  const persDed    = 11_000_000
  const depDed     = (w.dependents || 0) * 4_400_000
  const taxable    = Math.max(gross - taxExempt - bhxh - bhyt - bhtn - persDed - depDed, 0)
  const pit        = calcPit(taxable)
  const net        = gross - bhxh - bhyt - bhtn - pit
  const bhxhEmp    = Math.round(bhxhBase * 0.175)
  const bhytEmp    = Math.round(bhxhBase * 0.03)
  const bhtnEmp    = Math.round(bhtnBase * 0.01)
  const bhtnldEmp  = Math.round(bhxhBase * 0.005)
  const totalEmp   = gross + bhxhEmp + bhytEmp + bhtnEmp + bhtnldEmp

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Cấu hình lương</h1>
        <p className="text-sm text-gray-500 mt-0.5">Thiết lập lương, phụ cấp và hệ số — áp dụng cho cá nhân hoặc cả phòng ban</p>
      </div>

      {batchResult && (
        <div className={`rounded-lg px-4 py-3 text-sm border flex items-center gap-2
          ${batchResult.fail === 0
            ? 'bg-green-50 border-green-300 text-green-700'
            : 'bg-yellow-50 border-yellow-300 text-yellow-800'}`}>
          {batchResult.fail === 0
            ? `✓ Đã lưu thành công cho ${batchResult.ok} nhân viên`
            : `Lưu ${batchResult.ok} thành công, ${batchResult.fail} thất bại`}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-200 rounded-xl p-6 space-y-7">

        {/* ── Chọn đối tượng áp dụng ── */}
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-gray-800">Đối tượng áp dụng</p>
            <p className="text-xs text-gray-400 mt-0.5">Chọn 1 nhân viên hoặc cả phòng ban để áp dụng cùng 1 cấu hình lương</p>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2">
            {(['individual', 'department'] as SelectMode[]).map(m => (
              <button key={m} type="button" onClick={() => {
                setMode(m)
                setSelectedEmps([])
                setCheckedIds(new Set())
                setEmpSearch('')
                setDeptId('')
              }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  mode === m
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}>
                {m === 'individual' ? '👤 Cá nhân' : '🏢 Theo phòng ban'}
              </button>
            ))}
          </div>

          {/* ── Individual mode ── */}
          {mode === 'individual' && (
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Gõ tên hoặc mã nhân viên để tìm (ít nhất 2 ký tự)…"
                  value={empSearch}
                  onChange={e => { setEmpSearch(e.target.value); setShowList(true) }}
                  onFocus={() => setShowList(true)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {showList && empSearch_results?.content?.length ? (
                  <div className="absolute z-10 w-full mt-1 border border-gray-200 rounded-lg shadow-lg bg-white
                                  max-h-48 overflow-y-auto">
                    {empSearch_results.content.map(emp => (
                      <div key={emp.id}
                        onClick={() => {
                          addEmp(emp)
                          setEmpSearch('')
                          setShowList(false)
                        }}
                        className="px-3 py-2.5 text-sm hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0
                                   flex items-center justify-between">
                        <span>
                          <span className="font-medium text-gray-800">{emp.fullName}</span>
                          <span className="text-blue-600 ml-2 text-xs font-mono">{emp.employeeCode}</span>
                          {emp.position && <span className="text-gray-400 ml-2 text-xs">— {emp.position}</span>}
                        </span>
                        {selectedEmps.find(e => e.id === emp.id) && (
                          <span className="text-green-500 text-xs">✓ đã chọn</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              <p className="text-xs text-gray-400">Có thể thêm nhiều nhân viên — cấu hình sẽ áp dụng cho tất cả</p>
            </div>
          )}

          {/* ── Department mode ── */}
          {mode === 'department' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Chọn phòng ban</label>
                <select value={deptId} onChange={e => {
                  setDeptId(e.target.value)
                  setCheckedIds(new Set())
                  setSelectedEmps([])
                }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="">-- Chọn phòng ban --</option>
                  {departments?.filter(d => !d.code.startsWith('GRP-')).map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {deptEmployees?.content && deptEmployees.content.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Header + toggle all */}
                  <div className="bg-gray-50 px-3 py-2 flex items-center justify-between border-b border-gray-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox"
                        checked={checkedIds.size === deptEmployees.content.length}
                        onChange={toggleAllDept}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                      <span className="text-xs font-semibold text-gray-700">
                        Chọn tất cả ({deptEmployees.content.length} nhân viên)
                      </span>
                    </label>
                    {checkedIds.size > 0 && (
                      <span className="text-xs text-blue-600 font-medium">
                        Đã chọn {checkedIds.size}
                      </span>
                    )}
                  </div>
                  {/* Employee list */}
                  <div className="max-h-56 overflow-y-auto divide-y divide-gray-100">
                    {deptEmployees.content.map(emp => (
                      <label key={emp.id}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 cursor-pointer">
                        <input type="checkbox"
                          checked={checkedIds.has(emp.id)}
                          onChange={() => toggleDeptEmp(emp)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 flex-shrink-0" />
                        <span className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-800">{emp.fullName}</span>
                          <span className="text-blue-600 ml-2 text-xs font-mono">{emp.employeeCode}</span>
                        </span>
                        {emp.position && (
                          <span className="text-xs text-gray-400 flex-shrink-0">{emp.position}</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {deptId && deptEmployees?.content?.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Phòng ban này chưa có nhân viên đang làm việc</p>
              )}
            </div>
          )}

          {/* Selected chips */}
          {selectedEmps.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-xs font-semibold text-blue-700 w-full mb-1">
                {selectedEmps.length} nhân viên được áp dụng:
              </span>
              {selectedEmps.map(emp => (
                <EmpChip key={emp.id} emp={emp} onRemove={() => {
                  removeEmp(emp.id)
                  if (mode === 'department') {
                    const next = new Set(checkedIds)
                    next.delete(emp.id)
                    setCheckedIds(next)
                  }
                }} />
              ))}
            </div>
          )}
        </div>

        {/* ── Lương cơ bản & hệ số ── */}
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-gray-800">Lương cơ bản & Hệ số</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Lương thực tế = Lương cơ bản × Hệ số. Mức đóng BHXH/BHYT tính trên giá trị này (trần 46.8 triệu).
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Lương cơ bản (VND)"
              hint="Tối thiểu 1,000,000 ₫ — không bao gồm phụ cấp"
              error={errors.basicSalary?.message}>
              <NumInput register={register} name="basicSalary" placeholder="3000000" step="100000" min="1000000" />
            </Field>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Hệ số lương <span className="font-normal text-gray-400">(theo thang bảng lương)</span>
              </label>
              <div className="flex gap-2 mb-1.5">
                {(['preset', 'manual'] as const).map(m => (
                  <button key={m} type="button" onClick={() => setCoeffMode(m)}
                    className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                      coeffMode === m ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'
                    }`}>
                    {m === 'preset' ? 'Chọn bậc' : 'Nhập tay'}
                  </button>
                ))}
              </div>
              {coeffMode === 'preset' ? (
                <select onChange={e => setValue('coefficient', parseFloat(e.target.value), { shouldValidate: true })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="">-- Chọn bậc hệ số --</option>
                  {COEFFICIENT_PRESETS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              ) : (
                <input type="number" step="0.01" min="1" max="10" placeholder="VD: 2.34"
                  {...register('coefficient')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-400" />
              )}
              {errors.coefficient && <p className="text-xs text-red-500 mt-0.5">⚠ {errors.coefficient.message}</p>}
              {baseFull > 0 && (
                <p className="text-xs text-blue-600 mt-1 font-medium">→ {fmt(baseFull)} ₫/tháng</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Phụ cấp chịu thuế ── */}
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-gray-800">Phụ cấp chịu thuế (VND/tháng)</p>
            <p className="text-xs text-gray-400 mt-0.5">Tính vào thu nhập chịu thuế TNCN. Để 0 nếu không áp dụng.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Field label="Chức vụ" hint="Phó phòng ~500K–2M" error={errors.allowancePosition?.message}>
              <NumInput register={register} name="allowancePosition" placeholder="0" />
            </Field>
            <Field label="Thâm niên" hint="~5–10% lương CB/năm" error={errors.allowanceSeniority?.message}>
              <NumInput register={register} name="allowanceSeniority" placeholder="0" />
            </Field>
            <Field label="Nhà ở" hint="Tối đa 15% lương CB" error={errors.allowanceHouse?.message}>
              <NumInput register={register} name="allowanceHouse" placeholder="0" />
            </Field>
            <Field label="Phụ cấp khác" error={errors.allowanceOther?.message}>
              <NumInput register={register} name="allowanceOther" placeholder="0" />
            </Field>
          </div>
        </div>

        {/* ── Phụ cấp đặc biệt ── */}
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-gray-800">Phụ cấp đặc biệt (VND/tháng)</p>
            <p className="text-xs text-gray-400 mt-0.5">Được miễn hoặc giảm thuế theo quy định pháp luật.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="Ăn ca" note={<span className="text-green-600 font-normal">miễn thuế ≤730K</span>}
              hint="Phần vượt 730K tính vào TNCT" error={errors.allowanceFood?.message}>
              <NumInput register={register} name="allowanceFood" placeholder="730000" />
            </Field>
            <Field label="Đi lại / xăng xe" error={errors.allowanceTransport?.message}>
              <NumInput register={register} name="allowanceTransport" placeholder="0" />
            </Field>
            <Field label="Điện thoại" error={errors.allowancePhone?.message}>
              <NumInput register={register} name="allowancePhone" placeholder="0" />
            </Field>
          </div>
          <div className="max-w-xs">
            <Field label="Độc hại / nguy hiểm"
              note={<span className="text-green-600 font-normal">miễn thuế TNCN & BHXH — TT 111/2013</span>}
              hint="Tiếp xúc hóa chất, phóng xạ, môi trường độc hại"
              error={errors.allowanceToxic?.message}>
              <NumInput register={register} name="allowanceToxic" placeholder="0" />
            </Field>
          </div>
        </div>

        {/* ── Thuế & BHXH ── */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-800">Thuế TNCN & Bảo hiểm</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Số người phụ thuộc"
              note={<span className="text-gray-400 font-normal">(giảm 4.4 triệu/người/tháng)</span>}
              error={errors.dependents?.message}>
              <select {...register('dependents')}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-blue-400">
                {[0,1,2,3,4,5].map(n => (
                  <option key={n} value={n}>
                    {n} người{n > 0 ? ` — giảm ${fmt(n * 4_400_000)} ₫/tháng` : ''}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex items-end pb-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" {...register('bhxhExempt')}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Không đóng BHXH bắt buộc</p>
                  <p className="text-xs text-gray-400 mt-0.5">Hợp đồng &lt;1 tháng hoặc khoán việc</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* ── Preview ── */}
        {(w.basicSalary || 0) > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
            <p className="text-sm font-semibold text-gray-800">
              Dự kiến bảng lương
              {selectedEmps.length > 1 && (
                <span className="ml-2 text-xs font-normal text-gray-500">
                  (áp dụng cho {selectedEmps.length} nhân viên với cùng hệ số)
                </span>
              )}
            </p>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Thu nhập</p>
              <div className="space-y-1.5 text-sm">
                <Row label="Lương cơ bản × hệ số" value={fmt(baseFull)} />
                {taxableAlw > 0 && <Row label="Phụ cấp chịu thuế" value={fmt(taxableAlw)} />}
                {taxExempt > 0  && <Row label="Phụ cấp miễn thuế" value={fmt(taxExempt)} color="text-green-600" note="không tính thuế & BHXH" />}
                <Row label="Gross" value={fmt(gross)} bold />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Khấu trừ</p>
              <div className="space-y-1.5 text-sm">
                <Row label={`BHXH 8% (trên ${fmt(Math.min(baseFull, 46_800_000))})`} value={`- ${fmt(bhxh)}`} color="text-red-500" />
                <Row label="BHYT 1.5%" value={`- ${fmt(bhyt)}`} color="text-red-500" />
                <Row label="BHTN 1%" value={`- ${fmt(bhtn)}`} color="text-red-500" />
                <div className="border-t border-dashed border-gray-300 pt-1.5 mt-1 space-y-1.5">
                  <Row label="Giảm trừ bản thân 11 triệu" value={`- ${fmt(persDed)}`} color="text-green-600" />
                  {(w.dependents || 0) > 0 && <Row label={`Giảm trừ ${w.dependents} người phụ thuộc`} value={`- ${fmt(depDed)}`} color="text-green-600" />}
                  <Row label="Thu nhập chịu thuế" value={fmt(taxable)} />
                  <Row label="Thuế TNCN (lũy tiến)" value={`- ${fmt(pit)}`} color="text-red-500" />
                </div>
                <Row label="Lương NET thực nhận" value={`${fmt(net)} ₫`} bold bigValue color="text-green-700" />
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-2">Chi phí bệnh viện (chủ sử dụng)</p>
              <div className="space-y-1 text-sm">
                <Row label="BHXH 17.5%" value={fmt(bhxhEmp)} />
                <Row label="BHYT 3%" value={fmt(bhytEmp)} />
                <Row label="BHTN 1%" value={fmt(bhtnEmp)} />
                <Row label="BHTNLĐ-BNN 0.5%" value={fmt(bhtnldEmp)} />
                <Row label="Tổng chi phí nhân sự / tháng" value={`${fmt(totalEmp)} ₫`} bold color="text-orange-800" />
              </div>
            </div>
          </div>
        )}

        {/* ── Ngày áp dụng & Submit ── */}
        <Field label="Ngày áp dụng"
          hint="Hệ thống dùng bản mới nhất khi tính lương hàng tháng"
          error={errors.effectiveFrom?.message}>
          <input type="date" {...register('effectiveFrom')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </Field>

        <div className="flex items-center gap-4">
          <button type="submit" disabled={saving || selectedEmps.length === 0}
            className="bg-blue-600 text-white text-sm font-semibold px-8 py-2.5 rounded-lg
                       hover:bg-blue-700 disabled:opacity-40 transition-colors shadow-sm">
            {saving
              ? `Đang lưu ${selectedEmps.length} nhân viên…`
              : `Lưu cấu hình${selectedEmps.length > 1 ? ` cho ${selectedEmps.length} nhân viên` : ''}`}
          </button>
          {selectedEmps.length === 0 && (
            <p className="text-xs text-gray-400">Chọn nhân viên để kích hoạt nút lưu</p>
          )}
        </div>
      </form>

      {/* ── Lịch sử ── */}
      {history && history.length > 0 && selectedEmps.length === 1 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Lịch sử cấu hình — {selectedEmps[0].fullName}
          </h2>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Áp dụng từ</th>
                  <th className="px-4 py-3 text-right">Lương CB</th>
                  <th className="px-4 py-3 text-right">Hệ số</th>
                  <th className="px-4 py-3 text-right">Phụ cấp</th>
                  <th className="px-4 py-3 text-right">N. phụ thuộc</th>
                  <th className="px-4 py-3 text-right">Gross dự kiến</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((c: SalaryConfig) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{c.effectiveFrom}</td>
                    <td className="px-4 py-3 text-right">{fmt(c.basicSalary)}</td>
                    <td className="px-4 py-3 text-right">{c.coefficient}</td>
                    <td className="px-4 py-3 text-right">{fmt(c.totalAllowance)}</td>
                    <td className="px-4 py-3 text-right">{c.dependents} người</td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-700">
                      {fmt(c.effectiveSalary + c.totalAllowance)} ₫
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
