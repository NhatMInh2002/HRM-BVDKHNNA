'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  createEmployee,
  updateEmployee,
  getEmployee,
  CONTRACT_TYPE_LABELS,
  type CreateEmployeeDto,
} from '@/lib/personnel'

const schema = z.object({
  employeeCode: z.string().min(1, 'Bắt buộc').max(20),
  fullName: z.string().min(2, 'Bắt buộc').max(100),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().optional(),
  position: z.string().optional(),
  contractType: z.enum(['INDEFINITE', 'FIXED_TERM_1Y', 'FIXED_TERM_2Y', 'PART_TIME', 'PROBATION']),
  startDate: z.string().min(1, 'Bắt buộc'),
  endDate: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  editId: string | null
  onClose: () => void
  onSuccess: () => void
}

export function EmployeeFormModal({ editId, onClose, onSuccess }: Props) {
  const isEdit = !!editId

  const { data: existing } = useQuery({
    queryKey: ['employee', editId],
    queryFn: () => getEmployee(editId!),
    enabled: isEdit,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { contractType: 'INDEFINITE' },
  })

  useEffect(() => {
    if (existing) {
      reset({
        employeeCode: existing.employeeCode,
        fullName: existing.fullName,
        email: existing.email,
        phone: existing.phone ?? '',
        position: existing.position ?? '',
        contractType: existing.contractType,
        startDate: existing.startDate,
        endDate: existing.endDate ?? '',
      })
    }
  }, [existing, reset])

  const save = useMutation({
    mutationFn: (data: FormValues) => {
      const payload: CreateEmployeeDto = {
        ...data,
        phone: data.phone || undefined,
        position: data.position || undefined,
        endDate: data.endDate || undefined,
      }
      return isEdit ? updateEmployee(editId!, payload) : createEmployee(payload)
    },
    onSuccess,
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {isEdit ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit(d => save.mutate(d))} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Mã nhân viên *" error={errors.employeeCode?.message}>
              <input {...register('employeeCode')} disabled={isEdit}
                className="input" placeholder="NV001" />
            </Field>
            <Field label="Họ và tên *" error={errors.fullName?.message}>
              <input {...register('fullName')} className="input" placeholder="Nguyễn Văn A" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Email *" error={errors.email?.message}>
              <input {...register('email')} className="input" placeholder="nva@bvhn.vn" />
            </Field>
            <Field label="Số điện thoại" error={errors.phone?.message}>
              <input {...register('phone')} className="input" placeholder="0901234567" />
            </Field>
          </div>

          <Field label="Chức vụ" error={errors.position?.message}>
            <input {...register('position')} className="input" placeholder="Điều dưỡng, Bác sĩ..." />
          </Field>

          <Field label="Loại hợp đồng *" error={errors.contractType?.message}>
            <select {...register('contractType')} className="input">
              {Object.entries(CONTRACT_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Ngày bắt đầu *" error={errors.startDate?.message}>
              <input {...register('startDate')} type="date" className="input" />
            </Field>
            <Field label="Ngày kết thúc" error={errors.endDate?.message}>
              <input {...register('endDate')} type="date" className="input" />
            </Field>
          </div>

          {save.error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {(save.error as Error).message}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              Hủy
            </button>
            <button type="submit" disabled={save.isPending}
              className="px-4 py-2 text-sm text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60">
              {save.isPending ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
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
