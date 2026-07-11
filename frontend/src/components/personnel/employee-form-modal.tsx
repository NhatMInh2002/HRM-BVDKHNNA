'use client'
import { useEffect, useState } from 'react'
import { ResizableModal } from '@/components/resizable-modal'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  createEmployee, updateEmployee, getEmployee,
  GENDER_LABELS, type EmployeeFormDto,
} from '@/lib/personnel'
import { getDepartments } from '@/lib/departments'
import { getActiveLabels } from '@/lib/categories'
import { generateEmail } from '@/lib/emailUtils'
import { SearchSelect } from '@/components/search-select'

const schema = z.object({
  employeeCode:   z.string().min(1, 'Bắt buộc').max(20),
  fullName:       z.string().min(2, 'Bắt buộc').max(100),
  email:          z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  phone:          z.string().optional(),
  gender:         z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  dateOfBirth:    z.string().optional(),
  joinDate:       z.string().min(1, 'Bắt buộc'),
  contractType:   z.string().min(1, 'Bắt buộc'),
  departmentId:   z.string().optional(),
  position:       z.string().optional(),
  educationLevel: z.string().optional(),
  ethnicity:      z.string().optional(),
  religion:       z.string().optional(),
  hometown:       z.string().optional(),
  address:        z.string().optional(),
})

type FormValues = z.infer<typeof schema>

// Map free-text contractType → enum cho backend
const CONTRACT_ENUM_MAP: Record<string, string> = {
  'HĐ làm việc không xác định thời hạn (viên chức)': 'INDEFINITE',
  'HĐ làm việc xác định thời hạn 12–60 tháng (viên chức)': 'FIXED_TERM_2Y',
  'Quyết định tuyển dụng công chức': 'INDEFINITE',
  'HĐ lao động không xác định thời hạn': 'INDEFINITE',
  'HĐ lao động xác định thời hạn 12–36 tháng': 'FIXED_TERM_1Y',
  'HĐ lao động theo công việc dưới 12 tháng': 'FIXED_TERM_1Y',
  'HĐ thử việc (tối đa 2 tháng)': 'PROBATION',
  'HĐ chuyên môn kỹ thuật y tế': 'INDEFINITE',
  'HĐ khoán việc / dịch vụ': 'PART_TIME',
  // fallback cũ
  'INDEFINITE': 'INDEFINITE',
  'FIXED_TERM_1Y': 'FIXED_TERM_1Y',
  'FIXED_TERM_2Y': 'FIXED_TERM_2Y',
  'PART_TIME': 'PART_TIME',
  'PROBATION': 'PROBATION',
}

// "Huyện Nam Đàn" → "H. Nam Đàn"; "Thị xã Cửa Lò" → "TX. Cửa Lò"; "Thành phố Vinh" → "TP. Vinh"
// (khớp hậu tố trong ngoặc của danh mục phuong_xa, vd "X. Kim Liên (H. Nam Đàn)") — dùng để LỌC danh sách
function huyenAbbrev(huyenLabel: string): string {
  if (huyenLabel.startsWith('Thành phố ')) return `TP. ${huyenLabel.slice(10)}`
  if (huyenLabel.startsWith('Thị xã '))    return `TX. ${huyenLabel.slice(7)}`
  if (huyenLabel.startsWith('Huyện '))     return `H. ${huyenLabel.slice(6)}`
  return huyenLabel
}

/**
 * "X. Kim Liên (H. Nam Đàn)" → { xa: "Xã Kim Liên", huyen: "Huyện Nam Đàn" }
 * Lấy huyện trực tiếp từ hậu tố trong ngoặc của chính mục đã chọn — không dựa vào
 * bộ lọc "Chọn nhanh — Quận/huyện" (bộ lọc chỉ để rút gọn danh sách, có thể lệch
 * với lựa chọn thực tế nếu người dùng đổi bộ lọc sau khi đã chọn phường/xã).
 */
function parsePhuongXaLabel(label: string): { xa: string; huyen: string } {
  const m = label.match(/^(.*?)\s*\(([^)]+)\)\s*$/)
  const rawName  = m ? m[1] : label
  const rawHuyen = m ? m[2] : ''
  const xa = rawName.startsWith('X. ')  ? `Xã ${rawName.slice(3)}`
           : rawName.startsWith('P. ')  ? `Phường ${rawName.slice(3)}`
           : rawName.startsWith('TT. ') ? `Thị trấn ${rawName.slice(4)}`
           : rawName
  const huyen = rawHuyen.startsWith('TP. ') ? `Thành phố ${rawHuyen.slice(4)}`
              : rawHuyen.startsWith('TX. ') ? `Thị xã ${rawHuyen.slice(4)}`
              : rawHuyen.startsWith('H. ')  ? `Huyện ${rawHuyen.slice(3)}`
              : rawHuyen
  return { xa, huyen }
}

interface Props {
  editId: string | null
  onClose: () => void
  onSuccess: () => void
}

type Tab = 'co_ban' | 'chi_tiet' | 'dia_chi'

export function EmployeeFormModal({ editId, onClose, onSuccess }: Props) {
  const isEdit = !!editId
  const [activeTab, setActiveTab] = useState<Tab>('co_ban')

  const { data: existing } = useQuery({
    queryKey: ['employee', editId],
    queryFn: () => getEmployee(editId!),
    enabled: isEdit,
  })

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
    staleTime: 5 * 60_000,
  })

  // Danh mục từ localStorage
  const [positions, setPositions]    = useState<string[]>([])
  const [educations, setEducations]  = useState<string[]>([])
  const [ethnicities, setEthnicities]= useState<string[]>([])
  const [religions, setReligions]    = useState<string[]>([])
  const [contracts, setContracts]    = useState<string[]>([])
  const [quanHuyens, setQuanHuyens]  = useState<string[]>([])
  const [phuongXas, setPhuongXas]    = useState<string[]>([])

  useEffect(() => {
    setPositions(getActiveLabels('chuc_vu'))
    setEducations(getActiveLabels('trinh_do'))
    setEthnicities(getActiveLabels('dan_toc'))
    setReligions(getActiveLabels('ton_giao'))
    setContracts(getActiveLabels('loai_hop_dong'))
    setQuanHuyens(getActiveLabels('quan_huyen'))
    setPhuongXas(getActiveLabels('phuong_xa'))
  }, [])

  // Chọn nhanh quận/huyện → phường/xã (chỉ lọc danh sách, không phải field submit) —
  // dùng chung cho cả "Quê quán" và "Địa chỉ thường trú"
  const [hometownHuyen, setHometownHuyen] = useState('')
  const [addressHuyen,  setAddressHuyen]  = useState('')
  const phuongXasFor = (huyen: string) =>
    huyen ? phuongXas.filter(p => p.includes(`(${huyenAbbrev(huyen)})`)) : phuongXas

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { contractType: 'HĐ làm việc không xác định thời hạn (viên chức)' },
  })

  useEffect(() => {
    if (existing) {
      reset({
        employeeCode:   existing.employeeCode,
        fullName:       existing.fullName,
        email:          existing.email ?? '',
        phone:          existing.phone ?? '',
        gender:         existing.gender,
        dateOfBirth:    existing.dateOfBirth ?? '',
        joinDate:       existing.joinDate,
        contractType:   existing.contractType,
        departmentId:   existing.department?.id ?? '',
        position:       existing.position ?? '',
        educationLevel: existing.educationLevel ?? '',
        ethnicity:      existing.ethnicity ?? '',
        religion:       existing.religion ?? '',
        hometown:       existing.hometown ?? '',
        address:        existing.address ?? '',
      })
    }
  }, [existing, reset])

  // Auto-fill email khi nhập tên (chỉ khi thêm mới và email chưa được nhập thủ công)
  const fullName = watch('fullName')
  const emailValue = watch('email')
  useEffect(() => {
    if (isEdit) return
    if (emailValue && emailValue !== generateEmail(fullName ?? '')) return // đã nhập tay
    const generated = generateEmail(fullName ?? '')
    if (generated) setValue('email', generated, { shouldValidate: false })
  }, [fullName]) // eslint-disable-line react-hooks/exhaustive-deps

  const save = useMutation({
    mutationFn: (data: FormValues) => {
      const contractEnum = CONTRACT_ENUM_MAP[data.contractType] ?? 'INDEFINITE'
      const payload: EmployeeFormDto = {
        employeeCode:   data.employeeCode,
        fullName:       data.fullName,
        email:          data.email || undefined,
        phone:          data.phone || undefined,
        gender:         data.gender || undefined,
        dateOfBirth:    data.dateOfBirth || undefined,
        joinDate:       data.joinDate,
        contractType:   contractEnum as any,
        departmentId:   data.departmentId || undefined,
        position:       data.position || undefined,
        educationLevel: data.educationLevel || undefined,
        ethnicity:      data.ethnicity || undefined,
        religion:       data.religion || undefined,
        hometown:       data.hometown || undefined,
        address:        data.address || undefined,
      }
      return isEdit ? updateEmployee(editId!, payload) : createEmployee(payload)
    },
    onSuccess,
  })

  const TABS: { key: Tab; label: string }[] = [
    { key: 'co_ban',  label: 'Cơ bản' },
    { key: 'chi_tiet',label: 'Chi tiết' },
    { key: 'dia_chi', label: 'Địa chỉ' },
  ]

  return (
    <ResizableModal onClose={onClose} defaultWidth={720} defaultHeight={620}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {isEdit ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          {TABS.map(t => (
            <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
              className={`py-2.5 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(d => save.mutate(d))} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">

            {/* ── Tab Cơ bản ── */}
            {activeTab === 'co_ban' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Mã cán bộ *" error={errors.employeeCode?.message}>
                    <input {...register('employeeCode')} disabled={isEdit}
                      className="input" placeholder="040xxx..." />
                  </Field>
                  <Field label="Họ và tên *" error={errors.fullName?.message}>
                    <input {...register('fullName')} className="input" placeholder="Nguyễn Văn A" />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Email" error={errors.email?.message}>
                    <input {...register('email')} className="input" placeholder="nva@bvnghean.vn" />
                  </Field>
                  <Field label="Số điện thoại">
                    <input {...register('phone')} className="input" placeholder="0901234567" />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Giới tính">
                    <select {...register('gender')} className="input">
                      <option value="">— Chọn —</option>
                      {Object.entries(GENDER_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Ngày sinh">
                    <input {...register('dateOfBirth')} type="date" className="input" />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Phòng ban">
                    <SearchSelect
                      className="input"
                      value={watch('departmentId') ?? ''}
                      onChange={v => setValue('departmentId', v)}
                      options={departments.filter(d => !d.code.startsWith('GRP-')).map(d => ({ value: d.id, label: d.name }))}
                      placeholder="Gõ tên khoa/phòng để tìm..."
                    />
                  </Field>
                  <Field label="Chức vụ">
                    <SearchSelect
                      className="input"
                      value={watch('position') ?? ''}
                      onChange={v => setValue('position', v)}
                      options={positions.map(p => ({ value: p, label: p }))}
                      placeholder="Gõ để tìm chức vụ..."
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Loại hợp đồng *" error={errors.contractType?.message}>
                    <select {...register('contractType')} className="input">
                      <option value="">— Chọn loại HĐ —</option>
                      {contracts.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Ngày vào ngành *" error={errors.joinDate?.message}>
                    <input {...register('joinDate')} type="date" className="input" />
                  </Field>
                </div>
              </>
            )}

            {/* ── Tab Chi tiết ── */}
            {activeTab === 'chi_tiet' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Trình độ">
                    <select {...register('educationLevel')} className="input">
                      <option value="">— Chọn trình độ —</option>
                      {educations.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </Field>
                  <Field label="Dân tộc">
                    <SearchSelect
                      className="input"
                      value={watch('ethnicity') ?? ''}
                      onChange={v => setValue('ethnicity', v)}
                      options={ethnicities.map(e => ({ value: e, label: e }))}
                      placeholder="Gõ để tìm dân tộc..."
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Tôn giáo">
                    <select {...register('religion')} className="input">
                      <option value="">— Chọn tôn giáo —</option>
                      {religions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </Field>
                </div>
              </>
            )}

            {/* ── Tab Địa chỉ ── */}
            {activeTab === 'dia_chi' && (
              <>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Chọn nhanh — Quận/huyện">
                      <SearchSelect className="input" value={hometownHuyen} onChange={setHometownHuyen}
                        options={toOptions(quanHuyens)} placeholder="— Tất cả —" />
                    </Field>
                    <Field label="Chọn nhanh — Phường/xã">
                      <SearchSelect className="input" resetAfterSelect value="" placeholder="— Chọn để điền nhanh —"
                        options={toOptions(phuongXasFor(hometownHuyen))}
                        onChange={v => {
                          if (!v) return
                          const { xa, huyen } = parsePhuongXaLabel(v)
                          setValue('hometown', `${xa}, ${huyen}, Nghệ An`, { shouldValidate: true })
                        }} />
                    </Field>
                  </div>
                  <Field label="Quê quán" hint="Chọn nhanh ở trên hoặc gõ trực tiếp — có thể sửa sau khi chọn">
                    <input {...register('hometown')} className="input"
                      placeholder="Xã Kim Liên, Nam Đàn, Nghệ An" />
                  </Field>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Chọn nhanh — Quận/huyện">
                      <SearchSelect className="input" value={addressHuyen} onChange={setAddressHuyen}
                        options={toOptions(quanHuyens)} placeholder="— Tất cả —" />
                    </Field>
                    <Field label="Chọn nhanh — Phường/xã">
                      <SearchSelect className="input" resetAfterSelect value="" placeholder="— Chọn để điền nhanh —"
                        options={toOptions(phuongXasFor(addressHuyen))}
                        onChange={v => {
                          if (!v) return
                          const { xa, huyen } = parsePhuongXaLabel(v)
                          setValue('address', `${xa}, ${huyen}, Nghệ An`, { shouldValidate: true })
                        }} />
                    </Field>
                  </div>
                  <Field label="Địa chỉ thường trú" hint="Chọn nhanh ở trên rồi gõ thêm số nhà/đường vào đầu ô bên dưới nếu cần">
                    <input {...register('address')} className="input"
                      placeholder="Số nhà, đường, phường/xã, quận/huyện..." />
                  </Field>
                </div>
              </>
            )}

            {save.error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {(save.error as Error).message}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
            <div className="flex gap-1">
              {TABS.map((t, i) => (
                <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
                  className={`w-2 h-2 rounded-full transition-colors ${activeTab === t.key ? 'bg-blue-600' : 'bg-gray-300'}`} />
              ))}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                Hủy
              </button>
              <button type="submit" disabled={save.isPending}
                className="px-5 py-2 text-sm text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60 font-medium">
                {save.isPending ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </ResizableModal>
  )
}

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

const toOptions = (values: string[]) => values.map(v => ({ value: v, label: v }))
