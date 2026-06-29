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

  useEffect(() => {
    setPositions(getActiveLabels('chuc_vu'))
    setEducations(getActiveLabels('trinh_do'))
    setEthnicities(getActiveLabels('dan_toc'))
    setReligions(getActiveLabels('ton_giao'))
    setContracts(getActiveLabels('loai_hop_dong'))
  }, [])

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
                    <select {...register('departmentId')} className="input">
                      <option value="">— Chọn phòng ban —</option>
                      {departments.filter(d => !d.code.startsWith('GRP-')).map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Chức vụ">
                    <select {...register('position')} className="input">
                      <option value="">— Chọn chức vụ —</option>
                      {positions.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
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
                    <select {...register('ethnicity')} className="input">
                      <option value="">— Chọn dân tộc —</option>
                      {ethnicities.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
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
                <Field label="Quê quán">
                  <input {...register('hometown')} className="input"
                    placeholder="Xã Kim Liên, Nam Đàn, Nghệ An" />
                </Field>
                <Field label="Địa chỉ thường trú">
                  <input {...register('address')} className="input"
                    placeholder="Số nhà, đường, phường/xã, quận/huyện..." />
                </Field>
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

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
