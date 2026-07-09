'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  searchEmployees, getDepartments, Employee,
  getCurrentConcurrentAssignment, createConcurrentAssignment, endConcurrentAssignment,
  CONCURRENT_ROLE_LABELS, ConcurrentRoleType,
  getEmployeeDocuments, registerEmployeeDocument, verifyEmployeeDocument, uploadRawFile,
  DOCUMENT_TYPE_LABELS, DocumentType, EmployeeDocument,
} from '@/lib/personnel'
import { saveSalaryConfig, getSalaryHistory, SalaryConfig } from '@/lib/payroll'
import { SearchSelect } from '@/components/search-select'
import {
  saveSalaryIncrementConfig, getSalaryIncrementHistory, getIncrementCoefficientOptions, approveSalaryIncrement,
  SalaryIncrementConfig, QualificationAdjustment, QUALIFICATION_ADJUSTMENT_LABELS,
} from '@/lib/payroll'

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
  step: number | string; title: string; desc?: string; children: React.ReactNode
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

function NumInput<T extends Record<string, any>>({ register, name, placeholder, step = '1000', min = '0' }: {
  register: ReturnType<typeof useForm<T>>['register']
  name: keyof T; placeholder?: string; step?: string; min?: string
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

// ── Page ──────────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'basic' as const, label: 'Lương cơ bản', icon: '💰',
    desc: 'Lương cơ bản, hệ số ngạch/bậc và các khoản phụ cấp' },
  { key: 'increment' as const, label: 'Lương tăng thêm', icon: '📈',
    desc: 'Hệ số trách nhiệm, trình độ, kiêm nhiệm và xếp loại thi đua (Điều 34/35 quy chế chi tiêu nội bộ)' },
]
type TabKey = typeof TABS[number]['key']

export default function SalaryConfigPage() {
  const [selectedEmps, setSelectedEmps] = useState<Employee[]>([])
  const [activeTab, setActiveTab] = useState<TabKey>('basic')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Cấu hình lương</h1>
        <p className="text-sm text-gray-500 mt-0.5">Thiết lập lương cơ bản và lương tăng thêm — áp dụng cho cá nhân hoặc cả phòng ban</p>
      </div>

      <EmployeeSelectorCard selectedEmps={selectedEmps} setSelectedEmps={setSelectedEmps} />

      {selectedEmps.length === 0 ? (
        <div className="mt-5 bg-white border border-dashed border-gray-300 rounded-xl py-14 text-center">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">👆</span>
          </div>
          <p className="text-sm font-medium text-gray-600">Chọn nhân viên hoặc phòng ban ở trên để bắt đầu</p>
          <p className="text-xs text-gray-400 mt-1">Sau khi chọn, bạn có thể cấu hình lương cơ bản và lương tăng thêm bên dưới</p>
        </div>
      ) : (
        <div className="mt-5">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
            <div className="inline-flex bg-gray-100 rounded-lg p-1 gap-1">
              {TABS.map(t => (
                <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                    activeTab === t.key
                      ? 'bg-white text-blue-700 shadow-sm border border-gray-200'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  <span>{t.icon}</span>{t.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400">Áp dụng cho {selectedEmps.length} nhân viên</p>
          </div>
          <p className="text-sm text-gray-500 mb-4">{TABS.find(t => t.key === activeTab)!.desc}</p>

          {activeTab === 'basic'
            ? <BasicSalaryForm selectedEmps={selectedEmps} />
            : <SalaryIncrementSection selectedEmps={selectedEmps} />}
        </div>
      )}
    </div>
  )
}

// ── Đối tượng áp dụng (chọn nhân viên/phòng ban — dùng chung cho cả 2 tab) ──

function EmployeeSelectorCard({ selectedEmps, setSelectedEmps }: {
  selectedEmps: Employee[]
  setSelectedEmps: React.Dispatch<React.SetStateAction<Employee[]>>
}) {
  const [mode, setMode]               = useState<SelectMode>('individual')
  const [empSearch, setEmpSearch]     = useState('')
  const [showList, setShowList]       = useState(false)
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

  return (
    <SectionCard step="👤" title="Đối tượng áp dụng"
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
            <SearchSelect
              value={deptId}
              onChange={v => { setDeptId(v); setCheckedIds(new Set()); setSelectedEmps([]) }}
              options={(departments ?? []).filter(d => !d.code.startsWith('GRP-')).map(d => ({ value: d.id, label: d.name }))}
              placeholder="-- Chọn phòng ban --"
            />

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
  )
}

// ── Tab: Lương cơ bản & phụ cấp ──────────────────────────────────────────────

function BasicSalaryForm({ selectedEmps }: { selectedEmps: Employee[] }) {
  const qc = useQueryClient()

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

            {/* Bước 1 — Lương & Hệ số */}
            <SectionCard step={1} title="Lương cơ bản & Hệ số"
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

            {/* Bước 2 — Phụ cấp chịu thuế */}
            <SectionCard step={2} title="Phụ cấp chịu thuế"
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

            {/* Bước 3 — Phụ cấp đặc biệt */}
            <SectionCard step={3} title="Phụ cấp đặc biệt"
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

            {/* Bước 4 — Thuế & BHXH */}
            <SectionCard step={4} title="Giảm trừ thuế TNCN & Bảo hiểm">
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

            {/* Bước 5 — Ngày áp dụng */}
            <SectionCard step={5} title="Ngày áp dụng"
              desc="Hệ thống dùng bản mới nhất khi tính lương hàng tháng">
              <Field label="Ngày bắt đầu áp dụng" error={errors.effectiveFrom?.message}>
                <input type="date" {...register('effectiveFrom')}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </Field>
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

        {/* Xác nhận & lưu — nằm ngoài các bước, tách biệt khỏi form nhập liệu */}
        <div className="mt-5 pt-4 border-t border-gray-200 flex items-center gap-3">
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
      </form>
    </div>
  )
}

// ── Tab: Lương tăng thêm (TNTT) — Điều 34/35 ────────────────────────────────

const incrementSchema = z.object({
  responsibilityCoefficient:          z.coerce.number().min(0).default(0),
  responsibilitySecondaryCoefficient: z.coerce.number().min(0).default(0),
  qualificationCoefficient:           z.coerce.number().min(0).default(0),
  qualificationAdjustment:            z.enum(['NONE', 'MISSING_LICENSE', 'BRIDGE_DEGREE']).default('NONE'),
  specialtyMultiplierPercent:         z.coerce.number().min(0).default(100),
  concurrentUnionCoefficient:         z.coerce.number().min(0).default(0),
  concurrentDeptBonusPercent:         z.coerce.number().min(0).max(100).default(0),
  concurrentDeptTimePercent:          z.coerce.number().min(0).max(100).default(0),
  ratingCode:                         z.string().optional(),
  ratingPercentage:                  z.coerce.number().min(0).max(100).default(100),
  workdaysActual:                    z.coerce.number().min(0).max(31).default(22),
  workdaysStandard:                  z.coerce.number().min(1).max(31).default(22),
  paymentMultiplier:                 z.coerce.number().min(0).default(1),
  effectiveFrom:                     z.string().min(1, 'Chọn ngày áp dụng'),
})
type IncrementFormData = z.infer<typeof incrementSchema>

function SalaryIncrementSection({ selectedEmps }: { selectedEmps: Employee[] }) {
  const qc = useQueryClient()
  const { data: options } = useQuery({ queryKey: ['increment-coefficients'], queryFn: getIncrementCoefficientOptions })

  const firstEmpId = selectedEmps[0]?.id ?? null
  const { data: history } = useQuery({
    queryKey: ['increment-history', firstEmpId],
    queryFn: () => getSalaryIncrementHistory(firstEmpId!),
    enabled: !!firstEmpId && selectedEmps.length === 1,
  })

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<IncrementFormData>({
    resolver: zodResolver(incrementSchema),
    defaultValues: {
      responsibilityCoefficient: 0, responsibilitySecondaryCoefficient: 0,
      qualificationCoefficient: 0, qualificationAdjustment: 'NONE', specialtyMultiplierPercent: 100,
      concurrentUnionCoefficient: 0, concurrentDeptBonusPercent: 0, concurrentDeptTimePercent: 0,
      ratingPercentage: 100, workdaysActual: 22, workdaysStandard: 22, paymentMultiplier: 1,
    },
  })

  const [saving, setSaving] = useState(false)
  const [batchResult, setBatchResult] = useState<{ ok: number; fail: number } | null>(null)

  const onSubmit = async (data: IncrementFormData) => {
    if (selectedEmps.length === 0) return
    setSaving(true); setBatchResult(null)
    let ok = 0, fail = 0
    await Promise.allSettled(
      selectedEmps.map(emp =>
        saveSalaryIncrementConfig({ ...data, employeeId: emp.id } as any).then(() => ok++).catch(() => fail++)
      )
    )
    setSaving(false); setBatchResult({ ok, fail })
    if (ok > 0) qc.invalidateQueries({ queryKey: ['increment-history'] })
  }

  // Live preview — công thức khớp SalaryIncrementConfigResponse.from() phía backend
  const w = watch()
  const n = (v: unknown) => Number(v) || 0
  const LUONG_CO_SO = 2_530_000
  const responsibilityTotal = n(w.responsibilityCoefficient) + n(w.responsibilitySecondaryCoefficient) * 0.25
  const adjFactor = w.qualificationAdjustment === 'MISSING_LICENSE' ? 0.85
                  : w.qualificationAdjustment === 'BRIDGE_DEGREE' ? 0.95 : 1
  const qualAdjusted = n(w.qualificationCoefficient) * adjFactor * (n(w.specialtyMultiplierPercent) / 100)
  const concurrentDeptCoeff = qualAdjusted * (n(w.concurrentDeptBonusPercent) / 100) * (n(w.concurrentDeptTimePercent) / 100)
  const totalCoeff = responsibilityTotal + qualAdjusted + n(w.concurrentUnionCoefficient) + concurrentDeptCoeff
  const standard = n(w.workdaysStandard) || 22
  const incrementAmount = LUONG_CO_SO * totalCoeff * (n(w.ratingPercentage) / 100)
                         * (n(w.workdaysActual) / standard) * (n(w.paymentMultiplier) || 1)
  const hasPreview = totalCoeff > 0

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {batchResult && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm border flex items-center gap-2 ${
          batchResult.fail === 0
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-yellow-50 border-yellow-200 text-yellow-800'
        }`}>
          {batchResult.fail === 0
            ? `✓ Đã lưu lương tăng thêm cho ${batchResult.ok} nhân viên`
            : `Lưu ${batchResult.ok} thành công, ${batchResult.fail} thất bại`}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 items-start">
        <div className="space-y-4">

          {selectedEmps.length === 1 && (
            <SectionCard step={1} title="Hồ sơ đính kèm & gợi ý tự động"
              desc="Upload quyết định/bằng cấp — hệ thống OCR và gợi ý hệ số tương ứng, bạn xác nhận trước khi áp dụng">
              <EmployeeDocumentsWidget
                employeeId={selectedEmps[0].id}
                onApplyResponsibility={coeff => setValue('responsibilityCoefficient', coeff)}
                onApplyQualification={coeff => setValue('qualificationCoefficient', coeff)}
                onApplyConcurrentDept={(bonusPercent, timePercent) => {
                  setValue('concurrentDeptBonusPercent', bonusPercent)
                  setValue('concurrentDeptTimePercent', timePercent)
                }}
              />
            </SectionCard>
          )}

          <SectionCard step={2} title="Hệ số trách nhiệm / chức vụ"
            desc="Chọn chức vụ chính; nếu kiêm nhiệm chức vụ quản lý thứ 2, chọn thêm — hệ số phụ được tính 25%">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Chức vụ chính">
                <select onChange={e => setValue('responsibilityCoefficient', parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="0">-- Không giữ chức vụ --</option>
                  {options?.responsibilityOptions.map(o => (
                    <option key={o.id} value={o.coefficient}>{o.label} — {o.coefficient.toFixed(2)}</option>
                  ))}
                </select>
              </Field>
              <Field label="Kiêm nhiệm chức vụ thứ 2" hint="Hưởng 25% hệ số vị trí này">
                <select onChange={e => setValue('responsibilitySecondaryCoefficient', parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="0">-- Không kiêm nhiệm --</option>
                  {options?.responsibilityOptions.map(o => (
                    <option key={o.id} value={o.coefficient}>{o.label} — {o.coefficient.toFixed(2)}</option>
                  ))}
                </select>
              </Field>
            </div>
          </SectionCard>

          <SectionCard step={3} title="Hệ số trình độ chuyên môn"
            desc="Thiếu CCHN hưởng 85%, bằng liên thông hưởng 95% trên hệ số trình độ (không áp lên toàn bộ hệ số TNTT)">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Trình độ">
                <select onChange={e => setValue('qualificationCoefficient', parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="0">-- Chọn trình độ --</option>
                  {options?.qualificationOptions.map(o => (
                    <option key={o.id} value={o.coefficient}>{o.label} — {o.coefficient.toFixed(2)}</option>
                  ))}
                </select>
              </Field>
              <Field label="Điều chỉnh">
                <select {...register('qualificationAdjustment')}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-blue-400">
                  {(Object.keys(QUALIFICATION_ADJUSTMENT_LABELS) as QualificationAdjustment[]).map(k => (
                    <option key={k} value={k}>{QUALIFICATION_ADJUSTMENT_LABELS[k]}</option>
                  ))}
                </select>
              </Field>
              <Field label="Hệ số đặc thù khoa/phòng"
                hint="100% = bình thường. 110-135% cho khoa cấp cứu/hồi sức/ghép tạng — xác nhận với TCCB trước khi dùng"
                error={errors.specialtyMultiplierPercent?.message}>
                <NumInput register={register} name="specialtyMultiplierPercent" placeholder="100" step="1" />
              </Field>
            </div>
          </SectionCard>

          <SectionCard step={4} title="Kiêm nhiệm đoàn thể & khoa/phòng"
            desc="Đoàn thể: chỉ chọn 1 vai trò cao nhất nếu kiêm nhiệm nhiều vai trò">
            {selectedEmps.length === 1 && (
              <ConcurrentAssignmentWidget
                employeeId={selectedEmps[0].id}
                onApply={(bonusPercent, timePercent) => {
                  setValue('concurrentDeptBonusPercent', bonusPercent)
                  setValue('concurrentDeptTimePercent', timePercent)
                }}
              />
            )}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Kiêm nhiệm đoàn thể">
                <select onChange={e => setValue('concurrentUnionCoefficient', parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="0">-- Không kiêm nhiệm --</option>
                  {options?.concurrentUnionOptions.map(o => (
                    <option key={o.id} value={o.coefficient}>{o.label} — {o.coefficient.toFixed(2)}</option>
                  ))}
                </select>
              </Field>
              <Field label="Kiêm nhiệm khoa/phòng khác" hint="BS/DS +10%, ĐD/KTV +5%">
                <select onChange={e => setValue('concurrentDeptBonusPercent', parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="0">-- Không kiêm nhiệm --</option>
                  <option value="10">BS/DS — 10%</option>
                  <option value="5">Điều dưỡng/KTV — 5%</option>
                </select>
              </Field>
              <Field label="% thời gian kiêm nhiệm" error={errors.concurrentDeptTimePercent?.message}>
                <NumInput register={register} name="concurrentDeptTimePercent" placeholder="0" step="5" />
              </Field>
            </div>
          </SectionCard>

          <SectionCard step={5} title="Xếp loại thi đua & ngày công"
            desc="Xếp loại đã được Hội đồng thi đua duyệt theo phân loại khoa/phòng (dồn toa) — mục này chỉ ghi nhận kết quả">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Xếp loại thi đua">
                <select onChange={e => {
                  const opt = options?.ratingOptions.find(r => r.code === e.target.value)
                  setValue('ratingCode', e.target.value)
                  setValue('ratingPercentage', opt?.percentage ?? 100)
                }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="">-- Chọn xếp loại --</option>
                  {options?.ratingOptions.map(r => (
                    <option key={r.code} value={r.code}>{r.code} — {r.percentage}%</option>
                  ))}
                </select>
              </Field>
              <Field label="Ngày công thực tế" error={errors.workdaysActual?.message}>
                <NumInput register={register} name="workdaysActual" placeholder="22" step="1" />
              </Field>
              <Field label="Ngày công chuẩn" error={errors.workdaysStandard?.message}>
                <NumInput register={register} name="workdaysStandard" placeholder="22" step="1" />
              </Field>
              <Field label="Số lần chi trả" error={errors.paymentMultiplier?.message}>
                <NumInput register={register} name="paymentMultiplier" placeholder="1" step="0.1" />
              </Field>
            </div>
          </SectionCard>

          <SectionCard step={6} title="Ngày áp dụng">
            <Field label="Ngày bắt đầu áp dụng" error={errors.effectiveFrom?.message}>
              <input type="date" {...register('effectiveFrom')}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </Field>
          </SectionCard>
        </div>

        <div className="xl:sticky xl:top-6 space-y-3">
          <div className={`rounded-xl border overflow-hidden transition-all ${
            hasPreview ? 'border-blue-200 shadow-md shadow-blue-50' : 'border-gray-200'
          }`}>
            <div className={`px-4 py-3 border-b ${hasPreview ? 'bg-blue-600 border-blue-600' : 'bg-gray-50 border-gray-200'}`}>
              <p className={`text-sm font-semibold ${hasPreview ? 'text-white' : 'text-gray-500'}`}>Dự kiến TNTT</p>
            </div>
            <div className="bg-white px-4 py-4 space-y-2">
              <PreviewRow label="Hệ số trách nhiệm" value={responsibilityTotal.toFixed(3)} />
              <PreviewRow label="Hệ số trình độ (đã điều chỉnh)" value={qualAdjusted.toFixed(3)} />
              <PreviewRow label="Hệ số kiêm nhiệm khoa/phòng" value={concurrentDeptCoeff.toFixed(3)} />
              <PreviewRow label="Hệ số kiêm nhiệm đoàn thể" value={n(w.concurrentUnionCoefficient).toFixed(3)} />
              <PreviewRow label="Tổng hệ số điều chỉnh" value={totalCoeff.toFixed(3)} bold divider />
              <PreviewRow label="% xếp loại thi đua" value={`${n(w.ratingPercentage)}%`} />
              <PreviewRow label="Ngày công" value={`${n(w.workdaysActual)}/${standard}`} />
              <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-3 text-white mt-2">
                <p className="text-xs text-blue-200 font-medium">Lương tăng thêm dự kiến</p>
                <p className="text-xl font-bold mt-0.5">{fmt(incrementAmount)} ₫</p>
              </div>
            </div>
          </div>

          {history && history.length > 0 && selectedEmps.length === 1 && (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                <p className="text-xs font-semibold text-gray-600">Lịch sử TNTT — {selectedEmps[0].fullName}</p>
              </div>
              <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {history.map((c: SalaryIncrementConfig) => (
                  <div key={c.id} className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-700">{c.effectiveFrom}</span>
                        {c.status === 'APPROVED'
                          ? <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-100 text-green-700">Đã duyệt</span>
                          : <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Chờ duyệt</span>}
                      </div>
                      <span className="text-xs font-bold text-blue-700 tabular-nums">{fmt(c.incrementAmount)} ₫</span>
                    </div>
                    <div className="text-[11px] text-gray-400 flex items-center gap-3">
                      <span>Hệ số: {c.totalCoefficient.toFixed(2)}</span>
                      <span>Xếp loại: {c.ratingCode ?? '—'}</span>
                      {c.status !== 'APPROVED' && (
                        <button type="button"
                          onClick={async () => {
                            try { await approveSalaryIncrement(c.id); qc.invalidateQueries({ queryKey: ['increment-history'] }) }
                            catch (e) { alert((e as Error).message) }
                          }}
                          className="ml-auto text-[11px] font-semibold text-green-700 hover:underline">
                          Duyệt để tính lương →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="px-4 py-2 text-[11px] text-gray-400 border-t border-gray-100">
                Chỉ bản <b>Đã duyệt</b> mới được cộng vào bảng lương khi chạy tính lương kỳ.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Xác nhận & lưu — nằm ngoài các bước, tách biệt khỏi form nhập liệu */}
      <div className="mt-5 pt-4 border-t border-gray-200 flex items-center gap-3">
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold
                     px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors shadow-sm">
          {saving
            ? 'Đang lưu…'
            : selectedEmps.length > 1
              ? `Lưu cho ${selectedEmps.length} nhân viên`
              : 'Lưu lương tăng thêm'}
        </button>
      </div>
    </form>
  )
}

// ── Widget: kiêm nhiệm khoa/phòng (hồ sơ gốc — auto-fill hệ số kiêm nhiệm) ──

function ConcurrentAssignmentWidget({ employeeId, onApply }: {
  employeeId: string
  onApply: (bonusPercent: number, timePercent: number) => void
}) {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [departmentId, setDepartmentId] = useState('')
  const [roleType, setRoleType] = useState<ConcurrentRoleType>('BS_DS')
  const [timePercent, setTimePercent] = useState(30)
  const [effectiveFrom, setEffectiveFrom] = useState(() => new Date().toISOString().slice(0, 10))
  const [decisionNumber, setDecisionNumber] = useState('')

  const { data: departments } = useQuery({ queryKey: ['departments'], queryFn: getDepartments })
  const { data: current, isLoading } = useQuery({
    queryKey: ['concurrent-assignment-current', employeeId],
    queryFn: () => getCurrentConcurrentAssignment(employeeId),
  })

  const createMut = useMutation({
    mutationFn: () => createConcurrentAssignment({
      employeeId, departmentId, roleType, timePercent, effectiveFrom,
      decisionNumber: decisionNumber || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['concurrent-assignment-current', employeeId] })
      setShowForm(false); setDepartmentId(''); setDecisionNumber('')
    },
  })

  const endMut = useMutation({
    mutationFn: (id: string) => endConcurrentAssignment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['concurrent-assignment-current', employeeId] }),
  })

  if (isLoading) return null

  return (
    <div className="mb-4 rounded-xl border border-dashed border-blue-200 bg-blue-50/40 p-3">
      {current ? (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs text-gray-700">
            <span className="font-semibold">Đang kiêm nhiệm:</span> {current.departmentName} — {CONCURRENT_ROLE_LABELS[current.roleType]} · {current.timePercent}% thời gian
            {current.decisionNumber && <span className="text-gray-400"> (QĐ {current.decisionNumber})</span>}
          </div>
          <div className="flex items-center gap-2">
            <button type="button"
              onClick={() => onApply(current.bonusPercent, current.timePercent)}
              className="text-xs font-medium bg-blue-600 text-white px-2.5 py-1 rounded-md hover:bg-blue-700">
              Áp dụng vào lương tăng thêm
            </button>
            <button type="button"
              onClick={() => endMut.mutate(current.id)}
              className="text-xs text-red-500 hover:underline">
              Kết thúc
            </button>
          </div>
        </div>
      ) : !showForm ? (
        <button type="button" onClick={() => setShowForm(true)}
          className="text-xs font-medium text-blue-600 hover:underline">
          + Ghi nhận kiêm nhiệm khoa/phòng (theo quyết định điều động)
        </button>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 items-end">
          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">Khoa/phòng kiêm nhiệm</label>
            <SearchSelect
              value={departmentId}
              onChange={setDepartmentId}
              options={(departments ?? []).filter(d => !d.code.startsWith('GRP-')).map(d => ({ value: d.id, label: d.name }))}
              placeholder="-- Chọn --"
              className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs bg-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">Vai trò</label>
            <select value={roleType} onChange={e => setRoleType(e.target.value as ConcurrentRoleType)}
              className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs bg-white">
              {(Object.keys(CONCURRENT_ROLE_LABELS) as ConcurrentRoleType[]).map(k => (
                <option key={k} value={k}>{CONCURRENT_ROLE_LABELS[k]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">% thời gian</label>
            <input type="number" min={0} max={100} value={timePercent}
              onChange={e => setTimePercent(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">Ngày hiệu lực</label>
            <input type="date" value={effectiveFrom} onChange={e => setEffectiveFrom(e.target.value)}
              className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs" />
          </div>
          <div className="flex gap-1.5">
            <button type="button" disabled={!departmentId || createMut.isPending}
              onClick={() => createMut.mutate()}
              className="flex-1 text-xs font-medium bg-blue-600 text-white px-2 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-40">
              Lưu
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="text-xs text-gray-500 px-2 py-1.5 hover:text-gray-700">
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Widget: hồ sơ đính kèm + gợi ý OCR (upload TCCB) ─────────────────────────

const DOC_STATUS_LABELS: Record<EmployeeDocument['ocrStatus'], string> = {
  PENDING: 'Đang xử lý OCR…',
  DONE: 'Đã đọc xong',
  FAILED: 'OCR thất bại',
  SKIPPED: 'Bỏ qua (định dạng chưa hỗ trợ)',
}

const DOC_STATUS_COLORS: Record<EmployeeDocument['ocrStatus'], string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  DONE: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  SKIPPED: 'bg-gray-100 text-gray-500',
}

function suggestionText(doc: EmployeeDocument): string | null {
  if (doc.docType === 'APPOINTMENT_DECISION' && doc.matchedLabel) {
    return `Gợi ý chức vụ: ${doc.matchedLabel} — hệ số ${doc.matchedCoefficient?.toFixed(2)}`
  }
  if ((doc.docType === 'DEGREE_CERTIFICATE' || doc.docType === 'PRACTICE_LICENSE') && doc.matchedLabel) {
    return `Gợi ý trình độ: ${doc.matchedLabel} — hệ số ${doc.matchedCoefficient?.toFixed(2)}`
  }
  if (doc.docType === 'CONCURRENT_DECISION' && (doc.matchedDepartmentId || doc.matchedRoleType)) {
    return `Gợi ý kiêm nhiệm: ${doc.matchedLabel ?? '—'} · ${doc.matchedRoleType ?? '—'} · ${doc.matchedTimePercent ?? '?'}%`
  }
  return null
}

function EmployeeDocumentsWidget({ employeeId, onApplyResponsibility, onApplyQualification, onApplyConcurrentDept }: {
  employeeId: string
  onApplyResponsibility: (coeff: number) => void
  onApplyQualification: (coeff: number) => void
  onApplyConcurrentDept: (bonusPercent: number, timePercent: number) => void
}) {
  const qc = useQueryClient()
  const [docType, setDocType] = useState<DocumentType>('APPOINTMENT_DECISION')
  const [uploading, setUploading] = useState(false)

  const { data: documents = [] } = useQuery({
    queryKey: ['employee-documents', employeeId],
    queryFn: () => getEmployeeDocuments(employeeId),
    refetchInterval: q => (q.state.data ?? []).some(d => d.ocrStatus === 'PENDING') ? 3000 : false,
  })

  const verifyMut = useMutation({
    mutationFn: (id: string) => verifyEmployeeDocument(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee-documents', employeeId] }),
  })

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    try {
      const uploaded = await uploadRawFile(file, 'employee-documents')
      await registerEmployeeDocument({ employeeId, docType, fileUrl: uploaded.url, fileName: uploaded.name })
      qc.invalidateQueries({ queryKey: ['employee-documents', employeeId] })
    } finally {
      setUploading(false)
    }
  }

  const apply = (doc: EmployeeDocument) => {
    if ((doc.docType === 'APPOINTMENT_DECISION') && doc.matchedCoefficient != null) {
      onApplyResponsibility(doc.matchedCoefficient)
    } else if ((doc.docType === 'DEGREE_CERTIFICATE' || doc.docType === 'PRACTICE_LICENSE') && doc.matchedCoefficient != null) {
      onApplyQualification(doc.matchedCoefficient)
    } else if (doc.docType === 'CONCURRENT_DECISION' && doc.matchedRoleType) {
      onApplyConcurrentDept(doc.matchedRoleType === 'BS_DS' ? 10 : 5, doc.matchedTimePercent ?? 0)
    }
    verifyMut.mutate(doc.id)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="block text-[11px] font-medium text-gray-600 mb-1">Loại hồ sơ</label>
          <select value={docType} onChange={e => setDocType(e.target.value as DocumentType)}
            className="border border-gray-200 rounded-md px-2 py-1.5 text-xs bg-white">
            {(Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[]).map(k => (
              <option key={k} value={k}>{DOCUMENT_TYPE_LABELS[k]}</option>
            ))}
          </select>
        </div>
        <label className={`text-xs font-medium px-3 py-1.5 rounded-md cursor-pointer ${
          uploading ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}>
          {uploading ? 'Đang tải lên…' : '+ Upload ảnh (JPG/PNG)'}
          <input type="file" accept="image/*" className="hidden" disabled={uploading}
            onChange={e => handleFile(e.target.files?.[0])} />
        </label>
        <span className="text-[11px] text-gray-400">Chỉ hỗ trợ OCR trên ảnh — PDF cần chuyển sang ảnh trước</span>
      </div>

      {documents.length > 0 && (
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
          {documents.map(doc => {
            const suggestion = suggestionText(doc)
            return (
              <div key={doc.id} className="px-3 py-2.5 flex items-center justify-between gap-3 bg-white">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-700">{DOCUMENT_TYPE_LABELS[doc.docType]}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${DOC_STATUS_COLORS[doc.ocrStatus]}`}>
                      {DOC_STATUS_LABELS[doc.ocrStatus]}
                    </span>
                    {doc.verified && <span className="text-[10px] text-green-600">✓ Đã áp dụng</span>}
                  </div>
                  <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-[11px] text-blue-500 hover:underline">
                    {doc.fileName ?? 'Xem file'}
                  </a>
                  {suggestion && (
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {suggestion}
                      {doc.matchConfidence === 'LOW' && <span className="text-amber-500"> — kiểm tra lại trước khi dùng</span>}
                    </p>
                  )}
                  {doc.ocrStatus === 'FAILED' && (
                    <p className="text-[11px] text-red-400 mt-0.5">{doc.extractedText}</p>
                  )}
                </div>
                {suggestion && !doc.verified && (
                  <button type="button" onClick={() => apply(doc)}
                    className="flex-shrink-0 text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md hover:bg-blue-100">
                    Áp dụng
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
