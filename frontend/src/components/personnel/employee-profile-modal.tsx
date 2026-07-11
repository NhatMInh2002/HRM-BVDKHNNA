'use client'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ModalPortal } from '@/components/modal-portal'
import { SignedDocPanel } from '@/components/signed-doc-panel'
import {
  getEmployeeProfile, saveEmployeeProfile, downloadProfilePdf,
  type EmployeeProfile, type WorkHistoryItem, type TrainingItem,
  type FamilyRelationItem, type AwardItem,
} from '@/lib/personnel'

const EMPTY: EmployeeProfile = {
  birthPlace: null, nationalIdIssueDate: null, nationalIdIssuePlace: null,
  socialInsuranceNo: null, healthInsuranceNo: null, familyOrigin: null,
  jobBeforeRecruitment: null, recruitmentDate: null, recruitmentAgency: null,
  ngachCode: null, salaryGrade: null, salaryCoefficient: null, salaryEffectiveDate: null,
  educationGeneral: null, professionalDegree: null, politicalTheory: null,
  stateManagement: null, foreignLanguage: null, informaticsLevel: null,
  partyJoinDate: null, partyOfficialDate: null, youthUnionJoinDate: null,
  militaryServiceFrom: null, militaryServiceTo: null, warInvalidClass: null,
  policyFamilyType: null, healthStatus: null, heightCm: null, weightKg: null,
  bloodType: null, personalHistory: null, familyEconomy: null,
  workHistory: [], trainings: [], familyRelations: [], awards: [],
}

type Tab = 'general' | 'professional' | 'political' | 'training' | 'work' | 'family' | 'award'
const TABS: { key: Tab; label: string }[] = [
  { key: 'general',      label: 'Thông tin chung' },
  { key: 'professional', label: 'Ngạch bậc & trình độ' },
  { key: 'political',    label: 'Chính trị · Sức khỏe' },
  { key: 'training',     label: 'Đào tạo' },
  { key: 'work',         label: 'Công tác' },
  { key: 'award',        label: 'Khen thưởng · Kỷ luật' },
  { key: 'family',       label: 'Quan hệ gia đình' },
]

export function EmployeeProfileModal({ employeeId, employeeName, canWrite, onClose }: {
  employeeId: string; employeeName: string; canWrite: boolean; onClose: () => void
}) {
  const [tab, setTab] = useState<Tab>('general')
  const [form, setForm] = useState<EmployeeProfile>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['employee-profile', employeeId],
    queryFn: () => getEmployeeProfile(employeeId),
  })
  useEffect(() => { if (data) setForm({ ...EMPTY, ...data }) }, [data])

  const set = <K extends keyof EmployeeProfile>(k: K, v: EmployeeProfile[K]) =>
    setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    setSaving(true); setMsg(null)
    try {
      await saveEmployeeProfile(employeeId, form)
      setMsg({ type: 'ok', text: 'Đã lưu hồ sơ lý lịch.' })
    } catch (e) {
      setMsg({ type: 'err', text: (e as Error).message })
    } finally { setSaving(false) }
  }

  const exportPdf = async () => {
    try { await downloadProfilePdf(employeeId, employeeName) }
    catch (e) { setMsg({ type: 'err', text: (e as Error).message }) }
  }

  return (
    <ModalPortal onClose={onClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
        <div onClick={e => e.stopPropagation()}
          className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Sơ yếu lý lịch — {employeeName}</h2>
              <p className="text-xs text-gray-400">Mẫu HS02-VC/BNV (Thông tư 07/2019/TT-BNV)</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={exportPdf}
                className="px-3 py-1.5 text-sm rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                📄 Xuất PDF
              </button>
              <SignedDocPanel type="hs02" refId={employeeId} canUpload={canWrite} compact />
              <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600">✕</button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-4 pt-3 border-b border-gray-100 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-3 py-2 text-sm whitespace-nowrap rounded-t-lg border-b-2 -mb-px transition-colors
                  ${tab === t.key ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5">
            {isLoading ? (
              <div className="text-center text-gray-400 py-12">Đang tải hồ sơ…</div>
            ) : (
              <fieldset disabled={!canWrite} className="space-y-4">
                {tab === 'general' && <GeneralTab form={form} set={set} />}
                {tab === 'professional' && <ProfessionalTab form={form} set={set} />}
                {tab === 'political' && <PoliticalTab form={form} set={set} />}
                {tab === 'training' && (
                  <ListEditor<TrainingItem>
                    items={form.trainings} onChange={v => set('trainings', v)}
                    columns={[
                      { key: 'fromDate', label: 'Từ', type: 'date', w: 'w-32' },
                      { key: 'toDate', label: 'Đến', type: 'date', w: 'w-32' },
                      { key: 'institution', label: 'Cơ sở đào tạo', w: 'flex-1' },
                      { key: 'field', label: 'Chuyên ngành', w: 'flex-1' },
                      { key: 'form', label: 'Hình thức', w: 'w-32' },
                      { key: 'degree', label: 'Văn bằng', w: 'flex-1' },
                    ]}
                    blank={{ fromDate: null, toDate: null, institution: '', field: null, form: null, degree: null }} />
                )}
                {tab === 'work' && (
                  <ListEditor<WorkHistoryItem>
                    items={form.workHistory} onChange={v => set('workHistory', v)}
                    columns={[
                      { key: 'fromDate', label: 'Từ', type: 'date', w: 'w-32' },
                      { key: 'toDate', label: 'Đến', type: 'date', w: 'w-32' },
                      { key: 'unit', label: 'Đơn vị công tác', w: 'flex-1' },
                      { key: 'position', label: 'Chức vụ/Công việc', w: 'flex-1' },
                      { key: 'note', label: 'Ghi chú', w: 'w-40' },
                    ]}
                    blank={{ fromDate: null, toDate: null, unit: '', position: null, note: null }} />
                )}
                {tab === 'award' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Khen thưởng</h3>
                      <AwardEditor kind="AWARD" items={form.awards} onChange={v => set('awards', v)} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Kỷ luật</h3>
                      <AwardEditor kind="DISCIPLINE" items={form.awards} onChange={v => set('awards', v)} />
                    </div>
                  </div>
                )}
                {tab === 'family' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Bên bản thân</h3>
                      <FamilyEditor side="SELF" items={form.familyRelations} onChange={v => set('familyRelations', v)} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Bên vợ/chồng</h3>
                      <FamilyEditor side="SPOUSE" items={form.familyRelations} onChange={v => set('familyRelations', v)} />
                    </div>
                  </div>
                )}
              </fieldset>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className={`text-sm ${msg?.type === 'err' ? 'text-red-600' : 'text-green-600'}`}>
              {msg?.text ?? ''}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50">
                Đóng
              </button>
              {canWrite && (
                <button onClick={save} disabled={saving}
                  className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Đang lưu…' : 'Lưu hồ sơ'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}

// ── Field helpers ────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-500 mb-1">{label}</span>
      {children}
    </label>
  )
}
const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'

function Txt({ v, onChange, type = 'text' }: { v: string | number | null; onChange: (s: string) => void; type?: string }) {
  return <input type={type} value={v ?? ''} onChange={e => onChange(e.target.value)} className={inputCls} />
}

type SetFn = <K extends keyof EmployeeProfile>(k: K, v: EmployeeProfile[K]) => void
const s = (v: string) => (v === '' ? null : v)
const n = (v: string) => (v === '' ? null : Number(v))

function GeneralTab({ form, set }: { form: EmployeeProfile; set: SetFn }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Nơi sinh"><Txt v={form.birthPlace} onChange={v => set('birthPlace', s(v))} /></Field>
      <Field label="Thành phần gia đình xuất thân"><Txt v={form.familyOrigin} onChange={v => set('familyOrigin', s(v))} /></Field>
      <Field label="Ngày cấp CCCD"><Txt type="date" v={form.nationalIdIssueDate} onChange={v => set('nationalIdIssueDate', s(v))} /></Field>
      <Field label="Nơi cấp CCCD"><Txt v={form.nationalIdIssuePlace} onChange={v => set('nationalIdIssuePlace', s(v))} /></Field>
      <Field label="Số sổ BHXH"><Txt v={form.socialInsuranceNo} onChange={v => set('socialInsuranceNo', s(v))} /></Field>
      <Field label="Số thẻ BHYT"><Txt v={form.healthInsuranceNo} onChange={v => set('healthInsuranceNo', s(v))} /></Field>
      <Field label="Nghề nghiệp trước khi tuyển dụng"><Txt v={form.jobBeforeRecruitment} onChange={v => set('jobBeforeRecruitment', s(v))} /></Field>
      <Field label="Ngày tuyển dụng"><Txt type="date" v={form.recruitmentDate} onChange={v => set('recruitmentDate', s(v))} /></Field>
      <Field label="Cơ quan tuyển dụng"><Txt v={form.recruitmentAgency} onChange={v => set('recruitmentAgency', s(v))} /></Field>
    </div>
  )
}

function ProfessionalTab({ form, set }: { form: EmployeeProfile; set: SetFn }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Mã ngạch / Chức danh nghề nghiệp"><Txt v={form.ngachCode} onChange={v => set('ngachCode', s(v))} /></Field>
      <Field label="Bậc lương"><Txt type="number" v={form.salaryGrade} onChange={v => set('salaryGrade', n(v))} /></Field>
      <Field label="Hệ số lương"><Txt type="number" v={form.salaryCoefficient} onChange={v => set('salaryCoefficient', n(v))} /></Field>
      <Field label="Ngày hưởng bậc lương"><Txt type="date" v={form.salaryEffectiveDate} onChange={v => set('salaryEffectiveDate', s(v))} /></Field>
      <Field label="Giáo dục phổ thông"><Txt v={form.educationGeneral} onChange={v => set('educationGeneral', s(v))} /></Field>
      <Field label="Trình độ chuyên môn cao nhất"><Txt v={form.professionalDegree} onChange={v => set('professionalDegree', s(v))} /></Field>
      <Field label="Lý luận chính trị"><Txt v={form.politicalTheory} onChange={v => set('politicalTheory', s(v))} /></Field>
      <Field label="Quản lý nhà nước"><Txt v={form.stateManagement} onChange={v => set('stateManagement', s(v))} /></Field>
      <Field label="Ngoại ngữ"><Txt v={form.foreignLanguage} onChange={v => set('foreignLanguage', s(v))} /></Field>
      <Field label="Tin học"><Txt v={form.informaticsLevel} onChange={v => set('informaticsLevel', s(v))} /></Field>
    </div>
  )
}

function PoliticalTab({ form, set }: { form: EmployeeProfile; set: SetFn }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Ngày vào Đảng"><Txt type="date" v={form.partyJoinDate} onChange={v => set('partyJoinDate', s(v))} /></Field>
        <Field label="Ngày chính thức"><Txt type="date" v={form.partyOfficialDate} onChange={v => set('partyOfficialDate', s(v))} /></Field>
        <Field label="Ngày vào Đoàn / tổ chức CT-XH"><Txt type="date" v={form.youthUnionJoinDate} onChange={v => set('youthUnionJoinDate', s(v))} /></Field>
        <Field label="Gia đình chính sách"><Txt v={form.policyFamilyType} onChange={v => set('policyFamilyType', s(v))} /></Field>
        <Field label="Nhập ngũ"><Txt type="date" v={form.militaryServiceFrom} onChange={v => set('militaryServiceFrom', s(v))} /></Field>
        <Field label="Xuất ngũ"><Txt type="date" v={form.militaryServiceTo} onChange={v => set('militaryServiceTo', s(v))} /></Field>
        <Field label="Thương binh hạng"><Txt v={form.warInvalidClass} onChange={v => set('warInvalidClass', s(v))} /></Field>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Field label="Tình trạng sức khỏe"><Txt v={form.healthStatus} onChange={v => set('healthStatus', s(v))} /></Field>
        <Field label="Chiều cao (cm)"><Txt type="number" v={form.heightCm} onChange={v => set('heightCm', n(v))} /></Field>
        <Field label="Cân nặng (kg)"><Txt type="number" v={form.weightKg} onChange={v => set('weightKg', n(v))} /></Field>
        <Field label="Nhóm máu"><Txt v={form.bloodType} onChange={v => set('bloodType', s(v))} /></Field>
      </div>
      <Field label="Đặc điểm lịch sử bản thân">
        <textarea value={form.personalHistory ?? ''} onChange={e => set('personalHistory', s(e.target.value))}
          rows={3} className={inputCls} />
      </Field>
      <Field label="Hoàn cảnh kinh tế gia đình">
        <textarea value={form.familyEconomy ?? ''} onChange={e => set('familyEconomy', s(e.target.value))}
          rows={3} className={inputCls} />
      </Field>
    </div>
  )
}

// ── Generic list editor cho đào tạo & công tác ──────────────────────────────

interface ColDef<T> { key: keyof T; label: string; type?: string; w: string }
function ListEditor<T extends Record<string, any>>({ items, onChange, columns, blank }: {
  items: T[]; onChange: (v: T[]) => void; columns: ColDef<T>[]; blank: T
}) {
  const update = (i: number, key: keyof T, val: string) => {
    const next = [...items]
    next[i] = { ...next[i], [key]: val === '' ? null : val }
    onChange(next)
  }
  return (
    <div className="space-y-2">
      {items.length === 0 && <p className="text-sm text-gray-400">Chưa có dòng nào.</p>}
      {items.map((row, i) => (
        <div key={i} className="flex flex-wrap items-end gap-2 p-2 rounded-lg bg-gray-50">
          {columns.map(c => (
            <label key={String(c.key)} className={`${c.w} min-w-[100px]`}>
              <span className="block text-[11px] text-gray-400 mb-0.5">{c.label}</span>
              <input type={c.type ?? 'text'} value={row[c.key] ?? ''}
                onChange={e => update(i, c.key, e.target.value)}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm" />
            </label>
          ))}
          <button onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="px-2 py-1.5 text-red-500 hover:bg-red-50 rounded text-sm">Xóa</button>
        </div>
      ))}
      <button onClick={() => onChange([...items, { ...blank }])}
        className="text-sm text-blue-600 hover:underline">+ Thêm dòng</button>
    </div>
  )
}

function AwardEditor({ kind, items, onChange }: {
  kind: 'AWARD' | 'DISCIPLINE'; items: AwardItem[]; onChange: (v: AwardItem[]) => void
}) {
  const rows = items.map((it, idx) => ({ it, idx })).filter(r => r.it.type === kind)
  const update = (idx: number, patch: Partial<AwardItem>) => {
    const next = [...items]; next[idx] = { ...next[idx], ...patch }; onChange(next)
  }
  return (
    <div className="space-y-2">
      {rows.length === 0 && <p className="text-sm text-gray-400">Chưa có dòng nào.</p>}
      {rows.map(({ it, idx }) => (
        <div key={idx} className="flex flex-wrap items-end gap-2 p-2 rounded-lg bg-gray-50">
          <label className="w-20"><span className="block text-[11px] text-gray-400 mb-0.5">Năm</span>
            <input type="number" value={it.year ?? ''} onChange={e => update(idx, { year: e.target.value === '' ? null : Number(e.target.value) })}
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm" /></label>
          <label className="flex-1 min-w-[160px]"><span className="block text-[11px] text-gray-400 mb-0.5">Danh hiệu/Hình thức</span>
            <input value={it.title} onChange={e => update(idx, { title: e.target.value })}
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm" /></label>
          <label className="w-36"><span className="block text-[11px] text-gray-400 mb-0.5">Số quyết định</span>
            <input value={it.decisionNo ?? ''} onChange={e => update(idx, { decisionNo: e.target.value || null })}
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm" /></label>
          <label className="w-40"><span className="block text-[11px] text-gray-400 mb-0.5">Cấp quyết định</span>
            <input value={it.level ?? ''} onChange={e => update(idx, { level: e.target.value || null })}
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm" /></label>
          <button onClick={() => onChange(items.filter((_, j) => j !== idx))}
            className="px-2 py-1.5 text-red-500 hover:bg-red-50 rounded text-sm">Xóa</button>
        </div>
      ))}
      <button onClick={() => onChange([...items, { type: kind, year: null, title: '', decisionNo: null, level: null }])}
        className="text-sm text-blue-600 hover:underline">+ Thêm dòng</button>
    </div>
  )
}

function FamilyEditor({ side, items, onChange }: {
  side: 'SELF' | 'SPOUSE'; items: FamilyRelationItem[]; onChange: (v: FamilyRelationItem[]) => void
}) {
  const rows = items.map((it, idx) => ({ it, idx })).filter(r => r.it.side === side)
  const update = (idx: number, patch: Partial<FamilyRelationItem>) => {
    const next = [...items]; next[idx] = { ...next[idx], ...patch }; onChange(next)
  }
  return (
    <div className="space-y-2">
      {rows.length === 0 && <p className="text-sm text-gray-400">Chưa có dòng nào.</p>}
      {rows.map(({ it, idx }) => (
        <div key={idx} className="flex flex-wrap items-end gap-2 p-2 rounded-lg bg-gray-50">
          <label className="w-32"><span className="block text-[11px] text-gray-400 mb-0.5">Quan hệ</span>
            <input value={it.relation} onChange={e => update(idx, { relation: e.target.value })}
              placeholder="Cha, Mẹ, Vợ…" className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm" /></label>
          <label className="flex-1 min-w-[140px]"><span className="block text-[11px] text-gray-400 mb-0.5">Họ và tên</span>
            <input value={it.fullName} onChange={e => update(idx, { fullName: e.target.value })}
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm" /></label>
          <label className="w-24"><span className="block text-[11px] text-gray-400 mb-0.5">Năm sinh</span>
            <input type="number" value={it.birthYear ?? ''} onChange={e => update(idx, { birthYear: e.target.value === '' ? null : Number(e.target.value) })}
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm" /></label>
          <label className="flex-1 min-w-[160px]"><span className="block text-[11px] text-gray-400 mb-0.5">Nghề nghiệp / Nơi ở</span>
            <input value={it.detail ?? ''} onChange={e => update(idx, { detail: e.target.value || null })}
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm" /></label>
          <button onClick={() => onChange(items.filter((_, j) => j !== idx))}
            className="px-2 py-1.5 text-red-500 hover:bg-red-50 rounded text-sm">Xóa</button>
        </div>
      ))}
      <button onClick={() => onChange([...items, { side, relation: '', fullName: '', birthYear: null, detail: null }])}
        className="text-sm text-blue-600 hover:underline">+ Thêm dòng</button>
    </div>
  )
}
