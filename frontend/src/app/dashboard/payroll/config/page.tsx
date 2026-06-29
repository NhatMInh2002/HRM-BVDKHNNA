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

// Bảng hệ số lương CBCC-VC theo Nghị định 204/2004/NĐ-CP (lương cơ sở 2,530,000 từ 01/07/2026)
const SALARY_GRADE_GROUPS = [
  {
    label: 'Ngạch C — Nhân viên (bậc 1-12, hs 1.50-3.48)',
    grades: [
      { bac: 1, he_so: 1.50 }, { bac: 2, he_so: 1.68 }, { bac: 3, he_so: 1.86 },
      { bac: 4, he_so: 2.04 }, { bac: 5, he_so: 2.22 }, { bac: 6, he_so: 2.40 },
      { bac: 7, he_so: 2.58 }, { bac: 8, he_so: 2.76 }, { bac: 9, he_so: 2.94 },
      { bac: 10, he_so: 3.12 }, { bac: 11, he_so: 3.30 }, { bac: 12, he_so: 3.48 },
    ],
  },
  {
    label: 'Ngạch B — Nhân viên trung cấp (bậc 1-12, hs 1.86-4.06)',
    grades: [
      { bac: 1, he_so: 1.86 }, { bac: 2, he_so: 2.06 }, { bac: 3, he_so: 2.26 },
      { bac: 4, he_so: 2.46 }, { bac: 5, he_so: 2.66 }, { bac: 6, he_so: 2.86 },
      { bac: 7, he_so: 3.06 }, { bac: 8, he_so: 3.26 }, { bac: 9, he_so: 3.46 },
      { bac: 10, he_so: 3.66 }, { bac: 11, he_so: 3.86 }, { bac: 12, he_so: 4.06 },
    ],
  },
  {
    label: 'Ngạch A0 — Cán sự / Kỹ thuật viên (bậc 1-8, hs 2.10-4.27)',
    grades: [
      { bac: 1, he_so: 2.10 }, { bac: 2, he_so: 2.41 }, { bac: 3, he_so: 2.72 },
      { bac: 4, he_so: 3.03 }, { bac: 5, he_so: 3.34 }, { bac: 6, he_so: 3.65 },
      { bac: 7, he_so: 3.96 }, { bac: 8, he_so: 4.27 },
    ],
  },
  {
    label: 'Ngạch A1 — Chuyên viên / BS / Điều dưỡng hạng II-III (bậc 1-9, hs 2.34-4.98)',
    grades: [
      { bac: 1, he_so: 2.34 }, { bac: 2, he_so: 2.67 }, { bac: 3, he_so: 3.00 },
      { bac: 4, he_so: 3.33 }, { bac: 5, he_so: 3.66 }, { bac: 6, he_so: 3.99 },
      { bac: 7, he_so: 4.32 }, { bac: 8, he_so: 4.65 }, { bac: 9, he_so: 4.98 },
    ],
  },
  {
    label: 'Ngạch A2.2 — Chuyên viên chính / BS hạng II / Điều dưỡng hạng I (bậc 1-8, hs 4.00-6.38)',
    grades: [
      { bac: 1, he_so: 4.00 }, { bac: 2, he_so: 4.34 }, { bac: 3, he_so: 4.68 },
      { bac: 4, he_so: 5.02 }, { bac: 5, he_so: 5.36 }, { bac: 6, he_so: 5.70 },
      { bac: 7, he_so: 6.04 }, { bac: 8, he_so: 6.38 },
    ],
  },
  {
    label: 'Ngạch A2.1 — Chuyên viên cao cấp / BS chuyên khoa II (bậc 1-8, hs 4.40-6.78)',
    grades: [
      { bac: 1, he_so: 4.40 }, { bac: 2, he_so: 4.74 }, { bac: 3, he_so: 5.08 },
      { bac: 4, he_so: 5.42 }, { bac: 5, he_so: 5.76 }, { bac: 6, he_so: 6.10 },
      { bac: 7, he_so: 6.44 }, { bac: 8, he_so: 6.78 },
    ],
  },
  {
    label: 'Ngạch A3.2 — Cao cấp / BS hạng I (bậc 1-6, hs 5.75-7.55)',
    grades: [
      { bac: 1, he_so: 5.75 }, { bac: 2, he_so: 6.11 }, { bac: 3, he_so: 6.47 },
      { bac: 4, he_so: 6.83 }, { bac: 5, he_so: 7.19 }, { bac: 6, he_so: 7.55 },
    ],
  },
  {
    label: 'Ngạch A3.1 — Giáo sư / Phó GS (bậc 1-6, hs 6.20-8.00)',
    grades: [
      { bac: 1, he_so: 6.20 }, { bac: 2, he_so: 6.56 }, { bac: 3, he_so: 6.92 },
      { bac: 4, he_so: 7.28 }, { bac: 5, he_so: 7.64 }, { bac: 6, he_so: 8.00 },
    ],
  },
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
function SectionCard({ step, title, desc, children }: {
  step: number; title: string; desc?: string; children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-visible">
      <div className="flex items-start gap-4 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold
                         flex items-center justify-center mt-0.5">{step}</span>
        <div>
          <p className="text-sm font-semibold text-gray-800">{title}</p>
          {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function Field({ label, note, hint, error, children }: {
  label: string; note?: React.ReactNode; hint?: string; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1">
        {label}
        {note && <span className="ml-1.5 font-normal text-gray-400">{note}</span>}
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
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white
                 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
  )
}

function PreviewRow({ label, value, sub, color, bold, divider }: {
  label: string; value: string; sub?: string; color?: string; bold?: boolean; divider?: boolean
}) {
  return (
    <>
      {divider && <div className="border-t border-gray-100 my-1" />}
      <div className="flex items-baseline justify-between gap-2 py-0.5">
        <span className={`text-xs ${bold ? 'font-semibold text-gray-700' : 'text-gray-500'}`}>
          {label}
          {sub && <span className="text-gray-400 text-[10px] ml-1">({sub})</span>}
        </span>
        <span className={`text-xs font-semibold tabular-nums ${color ?? (bold ? 'text-gray-800' : 'text-gray-600')}`}>
          {value}
        </span>
      </div>
    </>
  )
}

function EmpChip({ emp, onRemove }: { emp: Employee; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-800
                     text-xs font-medium px-2.5 py-1 rounded-full">
      {emp.fullName}
      <span className="text-blue-400 font-mono text-[10px]">{emp.employeeCode}</span>
      <button type="button" onClick={onRemove}
        className="ml-0.5 text-blue-300 hover:text-red-500 transition-colors leading-none">✕</button>
    </span>
  )
}

type SelectMode = 'individual' | 'department'

export default function SalaryConfigPage() {
  const qc = useQueryClient()

  const [mode, setMode]               = useState<SelectMode>('individual')
  const [empSearch, setEmpSearch]     = useState('')
  const [showList, setShowList]       = useState(false)
  const [selectedEmps, setSelectedEmps] = useState<Employee[]>([])
  const [deptId, setDeptId]           = useState('')
  const [checkedIds, setCheckedIds]   = useState<Set<string>>(new Set())

  const { data: departments } = useQuery({ queryKey: ['departments'], queryFn: getDepartments })

  const { data: empResults } = useQuery({
    queryKey: ['employees-search', empSearch],
    queryFn: () => searchEmployees({ keyword: empSearch, page: 0, size: 20 }),
    enabled: mode === 'individual' && empSearch.length >= 2,
  })

  const { data: deptEmployees } = useQuery({
    queryKey: ['employees-by-dept', deptId],
    queryFn: () => searchEmployees({ departmentId: deptId, status: 'ACTIVE', page: 0, size: 100 }),
    enabled: mode === 'department' && deptId !== '',
  })

  const firstEmpId = selectedEmps[0]?.id ?? null
  const { data: history } = useQuery({
    queryKey: ['salary-history', firstEmpId],
    queryFn: () => getSalaryHistory(firstEmpId!),
    enabled: !!firstEmpId && selectedEmps.length === 1,
  })

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

  const [batchResult, setBatchResult] = useState<{ ok: number; fail: number } | null>(null)
  const [saving, setSaving] = useState(false)

  const onSubmit = async (data: FormData) => {
    if (selectedEmps.length === 0) return
    setSaving(true); setBatchResult(null)
    let ok = 0, fail = 0
    await Promise.allSettled(
      selectedEmps.map(emp =>
        saveSalaryConfig({ ...data, employeeId: emp.id }).then(() => ok++).catch(() => fail++)
      )
    )
    setSaving(false); setBatchResult({ ok, fail })
    if (ok > 0) qc.invalidateQueries({ queryKey: ['salary-history'] })
  }

  const addEmp = (emp: Employee) => {
    if (!selectedEmps.find(e => e.id === emp.id)) setSelectedEmps(p => [...p, emp])
  }
  const removeEmp = (id: string) => setSelectedEmps(p => p.filter(e => e.id !== id))

  const toggleDeptEmp = (emp: Employee) => {
    const next = new Set(checkedIds)
    next.has(emp.id) ? next.delete(emp.id) : next.add(emp.id)
    setCheckedIds(next)
    setSelectedEmps((deptEmployees?.content ?? []).filter(e => next.has(e.id)))
  }

  const toggleAllDept = () => {
    const all = deptEmployees?.content ?? []
    if (checkedIds.size === all.length) { setCheckedIds(new Set()); setSelectedEmps([]) }
    else { setCheckedIds(new Set(all.map(e => e.id))); setSelectedEmps(all) }
  }

  // Live salary calculations — dùng Number() để tránh string concatenation
  const w           = watch()
  const n           = (v: unknown) => Number(v) || 0
  const baseFull    = n(w.basicSalary) * (n(w.coefficient) || 1)
  const food        = n(w.allowanceFood)
  const foodExempt  = Math.min(food, 730_000)
  const foodTax     = Math.max(food - 730_000, 0)
  const taxExempt   = foodExempt + n(w.allowanceToxic)
  const taxableAlw  = foodTax + n(w.allowanceTransport) + n(w.allowancePhone)
                    + n(w.allowancePosition) + n(w.allowanceSeniority)
                    + n(w.allowanceHouse) + n(w.allowanceOther)
  const gross       = baseFull + taxableAlw + taxExempt
  const exempt      = w.bhxhExempt || false
  const bhxhBase    = exempt ? 0 : Math.min(baseFull, 46_800_000)
  const bhtnBase    = exempt ? 0 : Math.min(baseFull, 72_800_000)
  const bhxh        = Math.round(bhxhBase * 0.08)
  const bhyt        = Math.round(bhxhBase * 0.015)
  const bhtn        = Math.round(bhtnBase * 0.01)
  const persDed     = 11_000_000
  const depDed      = n(w.dependents) * 4_400_000
  const taxable     = Math.max(gross - taxExempt - bhxh - bhyt - bhtn - persDed - depDed, 0)
  const pit         = calcPit(taxable)
  const net         = gross - bhxh - bhyt - bhtn - pit
  const bhxhEmp    = Math.round(bhxhBase * 0.175)
  const bhytEmp    = Math.round(bhxhBase * 0.03)
  const bhtnEmp    = Math.round(bhtnBase * 0.01)
  const bhtnldEmp  = Math.round(bhxhBase * 0.005)
  const totalEmp   = gross + bhxhEmp + bhytEmp + bhtnEmp + bhtnldEmp
  const hasPreview  = n(w.basicSalary) > 0

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Cấu hình lương</h1>
        <p className="text-sm text-gray-500 mt-0.5">Thiết lập lương cơ bản, hệ số và phụ cấp — áp dụng cho cá nhân hoặc cả phòng ban</p>
      </div>

      {batchResult && (
        <div className={`mb-5 rounded-xl px-4 py-3 text-sm border flex items-center gap-2 ${
          batchResult.fail === 0
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-yellow-50 border-yellow-200 text-yellow-800'
        }`}>
          {batchResult.fail === 0
            ? `✓ Đã lưu thành công cho ${batchResult.ok} nhân viên`
            : `Lưu ${batchResult.ok} thành công, ${batchResult.fail} thất bại`}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* 2-column layout */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 items-start">

          {/* ── LEFT COLUMN — Form sections ── */}
          <div className="space-y-4">

            {/* Step 1 — Chọn đối tượng */}
            <SectionCard step={1} title="Đối tượng áp dụng"
              desc="Chọn nhân viên cụ thể hoặc áp dụng cùng cấu hình cho cả phòng ban">
              <div className="space-y-3">
                {/* Mode tabs */}
                <div className="inline-flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
                  {(['individual', 'department'] as SelectMode[]).map(m => (
                    <button key={m} type="button"
                      onClick={() => { setMode(m); setSelectedEmps([]); setCheckedIds(new Set()); setEmpSearch(''); setDeptId('') }}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                        mode === m
                          ? 'bg-white text-blue-700 shadow-sm border border-gray-200'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}>
                      {m === 'individual' ? '👤 Cá nhân' : '🏢 Theo phòng ban'}
                    </button>
                  ))}
                </div>

                {/* Individual search */}
                {mode === 'individual' && (
                  <div className="relative">
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
                      </svg>
                      <input type="text"
                        placeholder="Tìm theo tên hoặc mã nhân viên (ít nhất 2 ký tự)…"
                        value={empSearch}
                        onChange={e => { setEmpSearch(e.target.value); setShowList(true) }}
                        onFocus={() => setShowList(true)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg
                                   focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    {showList && empResults?.content?.length ? (
                      <div className="absolute z-20 w-full mt-1 border border-gray-200 rounded-xl shadow-xl bg-white
                                      max-h-52 overflow-y-auto">
                        {empResults.content.map(emp => (
                          <div key={emp.id}
                            onClick={() => { addEmp(emp); setEmpSearch(''); setShowList(false) }}
                            className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-50
                                       last:border-0 flex items-center justify-between group">
                            <div>
                              <span className="text-sm font-medium text-gray-800 group-hover:text-blue-700">{emp.fullName}</span>
                              <span className="text-blue-500 ml-2 text-xs font-mono">{emp.employeeCode}</span>
                              {emp.position && <span className="text-gray-400 ml-2 text-xs">· {emp.position}</span>}
                            </div>
                            {selectedEmps.find(e => e.id === emp.id) && (
                              <span className="text-green-500 text-xs font-medium">✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Department picker */}
                {mode === 'department' && (
                  <div className="space-y-3">
                    <select value={deptId} onChange={e => { setDeptId(e.target.value); setCheckedIds(new Set()); setSelectedEmps([]) }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white
                                 focus:outline-none focus:ring-2 focus:ring-blue-400">
                      <option value="">-- Chọn phòng ban --</option>
                      {departments?.filter(d => !d.code.startsWith('GRP-')).map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>

                    {deptEmployees?.content && deptEmployees.content.length > 0 && (
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between border-b border-gray-200">
                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <input type="checkbox"
                              checked={checkedIds.size === deptEmployees.content.length}
                              onChange={toggleAllDept}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                            <span className="text-xs font-semibold text-gray-700">
                              Chọn tất cả ({deptEmployees.content.length} nhân viên)
                            </span>
                          </label>
                          {checkedIds.size > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                              Đã chọn {checkedIds.size}
                            </span>
                          )}
                        </div>
                        <div className="max-h-52 overflow-y-auto divide-y divide-gray-50">
                          {deptEmployees.content.map(emp => (
                            <label key={emp.id}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 cursor-pointer">
                              <input type="checkbox"
                                checked={checkedIds.has(emp.id)}
                                onChange={() => toggleDeptEmp(emp)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 flex-shrink-0" />
                              <span className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-gray-800">{emp.fullName}</span>
                                <span className="text-blue-500 ml-2 text-xs font-mono">{emp.employeeCode}</span>
                              </span>
                              {emp.position && <span className="text-xs text-gray-400">{emp.position}</span>}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    {deptId && deptEmployees?.content?.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">Phòng ban này chưa có nhân viên</p>
                    )}
                  </div>
                )}

                {/* Selected chips */}
                {selectedEmps.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                    <p className="text-xs font-semibold text-blue-700 w-full">
                      {selectedEmps.length} nhân viên được áp dụng:
                    </p>
                    {selectedEmps.map(emp => (
                      <EmpChip key={emp.id} emp={emp} onRemove={() => {
                        removeEmp(emp.id)
                        if (mode === 'department') {
                          const next = new Set(checkedIds); next.delete(emp.id); setCheckedIds(next)
                        }
                      }} />
                    ))}
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Step 2 — Lương & Hệ số */}
            <SectionCard step={2} title="Lương cơ bản & Hệ số"
              desc="Lương thực tế = Lương cơ bản × Hệ số. Đây là cơ sở tính BHXH/BHYT (trần 46.8 triệu)">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Lương cơ bản (VND)"
                  hint="Không bao gồm phụ cấp"
                  error={errors.basicSalary?.message}>
                  <NumInput register={register} name="basicSalary" placeholder="3,000,000" step="100000" min="1000000" />
                </Field>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-gray-700">Hệ số lương</label>
                    <div className="inline-flex bg-gray-100 rounded-md p-0.5">
                      {(['preset', 'manual'] as const).map(m => (
                        <button key={m} type="button" onClick={() => setCoeffMode(m)}
                          className={`text-xs px-2.5 py-1 rounded transition-all ${
                            coeffMode === m ? 'bg-white shadow-sm text-blue-700 font-medium' : 'text-gray-500'
                          }`}>
                          {m === 'preset' ? 'Chọn bậc' : 'Nhập tay'}
                        </button>
                      ))}
                    </div>
                  </div>
                  {coeffMode === 'preset' ? (
                    <select onChange={e => {
                        const v = parseFloat(e.target.value)
                        if (!isNaN(v)) setValue('coefficient', v, { shouldValidate: true })
                      }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white
                                 focus:outline-none focus:ring-2 focus:ring-blue-400">
                      <option value="">-- Chọn ngạch / bậc --</option>
                      {SALARY_GRADE_GROUPS.map(grp => (
                        <optgroup key={grp.label} label={grp.label}>
                          {grp.grades.map(g => (
                            <option key={g.he_so} value={g.he_so}>
                              Bậc {g.bac} — Hệ số {g.he_so.toFixed(2)}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  ) : (
                    <input type="number" step="0.01" min="1" max="10" placeholder="VD: 2.34"
                      {...register('coefficient')}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                                 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  )}
                  {errors.coefficient && <p className="text-xs text-red-500 mt-0.5">⚠ {errors.coefficient.message}</p>}
                  {baseFull > 0 && (
                    <p className="text-xs text-blue-600 mt-1 font-semibold">→ {fmt(baseFull)} ₫/tháng</p>
                  )}
                </div>
              </div>
            </SectionCard>

            {/* Step 3 — Phụ cấp chịu thuế */}
            <SectionCard step={3} title="Phụ cấp chịu thuế"
              desc="Tính vào thu nhập chịu thuế TNCN. Để 0 nếu không áp dụng">
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
            </SectionCard>

            {/* Step 4 — Phụ cấp đặc biệt */}
            <SectionCard step={4} title="Phụ cấp đặc biệt"
              desc="Miễn hoặc giảm thuế theo quy định pháp luật">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Field label="Ăn ca"
                  note={<span className="text-green-600 text-[10px] font-semibold bg-green-50 px-1.5 py-0.5 rounded-full">miễn ≤730K</span>}
                  hint="Vượt 730K → chịu thuế"
                  error={errors.allowanceFood?.message}>
                  <NumInput register={register} name="allowanceFood" placeholder="730,000" />
                </Field>
                <Field label="Đi lại / xăng xe" error={errors.allowanceTransport?.message}>
                  <NumInput register={register} name="allowanceTransport" placeholder="0" />
                </Field>
                <Field label="Điện thoại" error={errors.allowancePhone?.message}>
                  <NumInput register={register} name="allowancePhone" placeholder="0" />
                </Field>
                <Field label="Độc hại / nguy hiểm"
                  note={<span className="text-green-600 text-[10px] font-semibold bg-green-50 px-1.5 py-0.5 rounded-full">miễn thuế & BHXH</span>}
                  hint="TT 111/2013"
                  error={errors.allowanceToxic?.message}>
                  <NumInput register={register} name="allowanceToxic" placeholder="0" />
                </Field>
              </div>
            </SectionCard>

            {/* Step 5 — Thuế & BHXH */}
            <SectionCard step={5} title="Giảm trừ thuế TNCN & Bảo hiểm">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Số người phụ thuộc"
                  note="(giảm 4.4 triệu/người/tháng)"
                  error={errors.dependents?.message}>
                  <select {...register('dependents')}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white
                               focus:outline-none focus:ring-2 focus:ring-blue-400">
                    {[0,1,2,3,4,5].map(n => (
                      <option key={n} value={n}>
                        {n} người{n > 0 ? ` — giảm ${fmt(n * 4_400_000)} ₫` : ''}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="flex items-center">
                  <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-gray-200
                                    hover:bg-gray-50 transition-colors w-full">
                    <input type="checkbox" {...register('bhxhExempt')}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Không đóng BHXH bắt buộc</p>
                      <p className="text-xs text-gray-400 mt-0.5">HĐ &lt;1 tháng hoặc khoán việc</p>
                    </div>
                  </label>
                </div>
              </div>
            </SectionCard>

            {/* Step 6 — Ngày áp dụng + Submit */}
            <SectionCard step={6} title="Ngày áp dụng & Xác nhận">
              <div className="flex items-end gap-4 flex-wrap">
                <Field label="Ngày bắt đầu áp dụng"
                  hint="Hệ thống dùng bản mới nhất khi tính lương hàng tháng"
                  error={errors.effectiveFrom?.message}>
                  <input type="date" {...register('effectiveFrom')}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </Field>
                <div className="flex items-center gap-3 pb-[2px]">
                  <button type="submit"
                    disabled={saving || selectedEmps.length === 0}
                    className="flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold
                               px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors shadow-sm">
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293z"/>
                    </svg>
                    {saving
                      ? `Đang lưu…`
                      : selectedEmps.length > 1
                        ? `Lưu cho ${selectedEmps.length} nhân viên`
                        : 'Lưu cấu hình'}
                  </button>
                  {selectedEmps.length === 0 && (
                    <p className="text-xs text-gray-400">Chọn nhân viên để kích hoạt</p>
                  )}
                </div>
              </div>
            </SectionCard>
          </div>

          {/* ── RIGHT COLUMN — Preview sticky ── */}
          <div className="xl:sticky xl:top-6 space-y-3">
            {/* Salary preview card */}
            <div className={`rounded-xl border overflow-hidden transition-all ${
              hasPreview ? 'border-blue-200 shadow-md shadow-blue-50' : 'border-gray-200'
            }`}>
              <div className={`px-4 py-3 border-b ${hasPreview ? 'bg-blue-600 border-blue-600' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-sm font-semibold ${hasPreview ? 'text-white' : 'text-gray-500'}`}>
                  Dự kiến bảng lương
                </p>
                {hasPreview && selectedEmps.length > 1 && (
                  <p className="text-blue-200 text-xs mt-0.5">Áp dụng cho {selectedEmps.length} nhân viên</p>
                )}
              </div>

              {!hasPreview ? (
                <div className="px-4 py-8 text-center bg-white">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <p className="text-xs text-gray-400">Nhập lương cơ bản để xem dự tính</p>
                </div>
              ) : (
                <div className="bg-white px-4 py-4 space-y-3">
                  {/* Thu nhập */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Thu nhập</p>
                    <div className="space-y-0.5">
                      <PreviewRow label="Lương CB × hệ số" value={`${fmt(baseFull)} ₫`} />
                      {taxableAlw > 0 && <PreviewRow label="Phụ cấp chịu thuế" value={`+ ${fmt(taxableAlw)} ₫`} />}
                      {taxExempt > 0 && <PreviewRow label="Phụ cấp miễn thuế" value={`+ ${fmt(taxExempt)} ₫`} color="text-green-600" />}
                      <PreviewRow label="GROSS" value={`${fmt(gross)} ₫`} bold divider />
                    </div>
                  </div>

                  {/* Khấu trừ NLĐ */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Khấu trừ (người lao động)</p>
                    <div className="space-y-0.5">
                      <PreviewRow label="BHXH 8%" value={`- ${fmt(bhxh)} ₫`} color="text-red-500" sub={`trên ${fmt(Math.min(baseFull, 46_800_000))}`} />
                      <PreviewRow label="BHYT 1.5%" value={`- ${fmt(bhyt)} ₫`} color="text-red-500" />
                      <PreviewRow label="BHTN 1%" value={`- ${fmt(bhtn)} ₫`} color="text-red-500" />
                      <PreviewRow label="Giảm trừ bản thân" value={`- ${fmt(persDed)} ₫`} color="text-green-600" divider />
                      {(w.dependents || 0) > 0 && (
                        <PreviewRow label={`Giảm trừ ${w.dependents} người phụ thuộc`} value={`- ${fmt(depDed)} ₫`} color="text-green-600" />
                      )}
                      <PreviewRow label="TNCT" value={`${fmt(taxable)} ₫`} />
                      <PreviewRow label="Thuế TNCN (lũy tiến)" value={`- ${fmt(pit)} ₫`} color="text-red-500" />
                    </div>
                  </div>

                  {/* NET */}
                  <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-3 text-white">
                    <p className="text-xs text-blue-200 font-medium">Lương NET thực nhận</p>
                    <p className="text-xl font-bold mt-0.5">{fmt(net)} ₫</p>
                  </div>

                  {/* Chi phí bệnh viện */}
                  <div className="rounded-xl bg-orange-50 border border-orange-100 px-4 py-3">
                    <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-2">Chi phí bệnh viện</p>
                    <div className="space-y-0.5">
                      <PreviewRow label="BHXH 17.5%" value={`${fmt(bhxhEmp)} ₫`} />
                      <PreviewRow label="BHYT 3%" value={`${fmt(bhytEmp)} ₫`} />
                      <PreviewRow label="BHTN 1%" value={`${fmt(bhtnEmp)} ₫`} />
                      <PreviewRow label="BHTNLĐ-BNN 0.5%" value={`${fmt(bhtnldEmp)} ₫`} />
                      <PreviewRow label="Tổng chi phí nhân sự" value={`${fmt(totalEmp)} ₫`} bold color="text-orange-800" divider />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* History card */}
            {history && history.length > 0 && selectedEmps.length === 1 && (
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                  <p className="text-xs font-semibold text-gray-600">Lịch sử — {selectedEmps[0].fullName}</p>
                </div>
                <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                  {history.map((c: SalaryConfig) => (
                    <div key={c.id} className="px-4 py-3 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-700">{c.effectiveFrom}</span>
                        <span className="text-xs font-bold text-blue-700 tabular-nums">
                          {fmt(c.effectiveSalary + c.totalAllowance)} ₫
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 flex gap-3">
                        <span>CB: {fmt(c.basicSalary)} ₫</span>
                        <span>× {c.coefficient}</span>
                        <span>PC: {fmt(c.totalAllowance)} ₫</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </form>
    </div>
  )
}
