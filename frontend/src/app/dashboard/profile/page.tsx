'use client'
import { useRef, useState } from 'react'
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { CONTRACT_TYPE_LABELS, STATUS_LABELS } from '@/lib/personnel'
import { apiFetch } from '@/lib/api'
import { getEmployeeContracts, CONTRACT_TYPE_LABELS as C_LABELS, CONTRACT_STATUS_LABELS } from '@/lib/contracts'
import { Badge } from '@/components/ui/badge'

const GENDER_LABELS: Record<string, string> = {
  MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác',
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 font-medium">{value || '—'}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h2>
      </div>
      <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
        {children}
      </div>
    </div>
  )
}

function SignatureUploader({ currentUrl }: { currentUrl?: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const qc = useQueryClient()
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const displayUrl = preview ?? currentUrl

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Chỉ chấp nhận file ảnh (jpg, png)'); return }
    if (file.size > 2 * 1024 * 1024) { setError('Ảnh tối đa 2MB'); return }

    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    setError(null); setLoading(true); setSuccess(false)
    try {
      const form = new FormData()
      form.append('file', file)
      await apiFetch<{ signatureUrl: string }>('/personnel/employees/me/signature', {
        method: 'POST', body: form, headers: {},
      })
      await qc.invalidateQueries({ queryKey: ['current-employee'] })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err?.message ?? 'Upload thất bại'); setPreview(null)
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative group cursor-pointer w-32 h-16 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden hover:border-blue-400 transition-colors bg-gray-50"
        onClick={() => inputRef.current?.click()}
      >
        {displayUrl ? (
          <img src={displayUrl} alt="Chữ ký" className="w-full h-full object-contain p-1" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
            </svg>
            <span className="text-[10px] mt-1">Chưa có</span>
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {error   && <p className="text-xs text-red-500 text-center">{error}</p>}
      {success && <p className="text-xs text-green-600 text-center">✓ Đã cập nhật</p>}
      {!error && !success && <p className="text-[10px] text-gray-400">Nhấn để cập nhật · PNG/JPG · 2MB</p>}
    </div>
  )
}

function AvatarUploader({ name, currentUrl }: { name: string; currentUrl?: string }) {
  const inputRef   = useRef<HTMLInputElement>(null)
  const qc         = useQueryClient()
  const [preview, setPreview]   = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState(false)

  const initials = name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
  const displayUrl = preview ?? currentUrl

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Client-side validation
    if (!file.type.startsWith('image/')) {
      setError('Chỉ chấp nhận file ảnh (jpg, png, webp)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ảnh không được vượt quá 5MB')
      return
    }

    // Show preview immediately
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    // Upload
    setError(null)
    setLoading(true)
    setSuccess(false)
    try {
      const form = new FormData()
      form.append('file', file)
      await apiFetch<{ avatarUrl: string }>('/personnel/employees/me/avatar', {
        method: 'POST',
        body: form,
        // Không set Content-Type — browser tự set multipart boundary
        headers: {},
      })
      await qc.invalidateQueries({ queryKey: ['current-employee'] })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err?.message ?? 'Upload thất bại')
      setPreview(null)
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative group cursor-pointer" onClick={() => inputRef.current?.click()}>
        {/* Avatar */}
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
          {displayUrl ? (
            <img src={displayUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold select-none">
              {initials}
            </div>
          )}
        </div>

        {/* Overlay khi hover */}
        <div className="absolute inset-0 rounded-full bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {loading ? (
            <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : (
            <>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <span className="text-white text-[10px] mt-1">Đổi ảnh</span>
            </>
          )}
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {error   && <p className="text-xs text-red-500 text-center">{error}</p>}
      {success && <p className="text-xs text-green-600 text-center">✓ Cập nhật thành công</p>}
      {!error && !success && (
        <p className="text-[11px] text-gray-400">Nhấn vào ảnh để thay đổi · Tối đa 5MB</p>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const { data: me, isLoading } = useCurrentEmployee()

  const [tab, setTab] = useState<'info' | 'contracts'>('info')

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts', me?.id],
    queryFn: () => getEmployeeContracts(me!.id),
    enabled: tab === 'contracts' && !!me?.id,
  })

  if (isLoading) {
    return <div className="text-gray-400 text-sm p-8 text-center">Đang tải...</div>
  }

  if (!me) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center text-sm text-yellow-800 max-w-lg mx-auto mt-8">
        <p className="font-semibold mb-1">Tài khoản chưa được liên kết</p>
        <p className="text-yellow-700">Vui lòng liên hệ Phòng Tổ chức cán bộ để được hỗ trợ.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Avatar + tên + chữ ký */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center gap-6">
        <AvatarUploader name={me.fullName} currentUrl={me.avatarUrl} />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-gray-800">{me.fullName}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{me.position || 'Chưa có chức vụ'}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {me.department?.name || 'Chưa gán phòng ban'} · {me.employeeCode}
          </p>
        </div>
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            me.status === 'ACTIVE'     ? 'bg-green-100 text-green-700' :
            me.status === 'PROBATION'  ? 'bg-yellow-100 text-yellow-700' :
                                         'bg-red-100 text-red-700'
          }`}>
            {STATUS_LABELS[me.status]}
          </span>
          <p className="text-[10px] text-gray-400 mt-2">Chữ ký</p>
          <SignatureUploader currentUrl={(me as any).signatureUrl} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(['info', 'contracts'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t === 'info' ? 'Thông tin' : `Hợp đồng${contracts.length > 0 ? ` (${contracts.length})` : ''}`}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <>
          <Section title="Thông tin cơ bản">
            <Field label="Họ và tên"      value={me.fullName} />
            <Field label="Mã cán bộ"      value={me.employeeCode} />
            <Field label="Email"           value={me.email} />
            <Field label="Số điện thoại"  value={me.phone} />
            <Field label="Giới tính"      value={me.gender ? GENDER_LABELS[me.gender] : undefined} />
            <Field label="Ngày sinh"       value={me.dateOfBirth ? format(new Date(me.dateOfBirth), 'dd/MM/yyyy') : undefined} />
            <Field label="Dân tộc"        value={me.ethnicity} />
            <Field label="Tôn giáo"       value={me.religion} />
          </Section>
          <Section title="Công tác">
            <Field label="Phòng ban / Khoa"  value={me.department?.name} />
            <Field label="Chức vụ"           value={me.position} />
            <Field label="Ngày vào làm"      value={me.joinDate ? format(new Date(me.joinDate), 'dd/MM/yyyy') : undefined} />
            <Field label="Loại hợp đồng"     value={CONTRACT_TYPE_LABELS[me.contractType]} />
            <Field label="Trình độ"          value={me.educationLevel} />
          </Section>
          <Section title="Địa chỉ">
            <Field label="Quê quán"   value={me.hometown} />
            <Field label="Địa chỉ"   value={me.address} />
          </Section>
          <p className="text-xs text-gray-400 text-center pb-2">
            Để cập nhật thông tin hồ sơ, vui lòng liên hệ Phòng Tổ chức cán bộ.
          </p>
        </>
      )}

      {tab === 'contracts' && (
        <div className="space-y-3">
          {contracts.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl py-12 text-center text-sm text-gray-400">
              Chưa có hợp đồng nào được ghi nhận.
            </div>
          ) : contracts.map(c => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-800">{c.contractNumber}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{C_LABELS[c.contractType] ?? c.contractType}</p>
                </div>
                <Badge
                  label={CONTRACT_STATUS_LABELS[c.status]}
                  variant={c.status === 'ACTIVE' ? 'green' : c.status === 'EXPIRED' ? 'red' : 'yellow'}
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Ngày ký</p>
                  <p className="text-gray-700">{format(new Date(c.signDate), 'dd/MM/yyyy')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Hiệu lực từ</p>
                  <p className="text-gray-700">{format(new Date(c.startDate), 'dd/MM/yyyy')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Đến ngày</p>
                  <p className="text-gray-700">{c.endDate ? format(new Date(c.endDate), 'dd/MM/yyyy') : 'Không xác định'}</p>
                </div>
                {c.salaryGrade && <div>
                  <p className="text-xs text-gray-400">Ngạch / bậc</p>
                  <p className="text-gray-700">{c.salaryGrade} {c.salaryCoefficient ? `(${c.salaryCoefficient})` : ''}</p>
                </div>}
                {c.totalSalary ? <div>
                  <p className="text-xs text-gray-400">Tổng lương</p>
                  <p className="font-semibold text-blue-700">{c.totalSalary.toLocaleString('vi-VN')} ₫</p>
                </div> : null}
                {c.signerName && <div>
                  <p className="text-xs text-gray-400">Người ký</p>
                  <p className="text-gray-700">{c.signerName}</p>
                </div>}
              </div>
              {c.attachmentUrl && (
                <a href={c.attachmentUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a3 3 0 016 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd"/>
                  </svg>
                  {c.attachmentName ?? 'Xem hợp đồng'}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
