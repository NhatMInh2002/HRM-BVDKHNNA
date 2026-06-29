'use client'
import { useState, useRef } from 'react'
import { ResizableModal } from '@/components/resizable-modal'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createContract, updateContract, CONTRACT_TYPE_LABELS, type Contract, type CreateContractDto } from '@/lib/contracts'
import { apiFetch } from '@/lib/api'

const CONTRACT_TYPES = Object.entries(CONTRACT_TYPE_LABELS)

interface Props {
  open: boolean
  onClose: () => void
  employeeId: string
  employeeName?: string
  departmentName?: string
  position?: string
  editing?: Contract | null
}

export function ContractModal({ open, onClose, employeeId, employeeName, departmentName, position, editing }: Props) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [attachment, setAttachment] = useState<{ url: string; name: string } | null>(
    editing ? { url: editing.attachmentUrl ?? '', name: editing.attachmentName ?? '' } : null
  )

  const today = new Date().toISOString().slice(0, 10)

  const [form, setForm] = useState<Omit<CreateContractDto, 'employeeId'>>({
    contractNumber: editing?.contractNumber ?? '',
    contractType:   editing?.contractType ?? 'INDEFINITE',
    startDate:      editing?.startDate ?? today,
    endDate:        editing?.endDate ?? '',
    signDate:       editing?.signDate ?? today,
    signerName:     editing?.signerName ?? 'Giám đốc Bệnh viện',
    position:       editing?.position ?? (position ?? ''),
    departmentName: editing?.departmentName ?? (departmentName ?? ''),
    baseSalary:     editing?.baseSalary ?? undefined,
    salaryGrade:    editing?.salaryGrade ?? '',
    salaryCoefficient: editing?.salaryCoefficient ?? undefined,
    allowancePosition:  editing?.allowancePosition ?? 0,
    allowanceSeniority: editing?.allowanceSeniority ?? 0,
    allowanceOther:     editing?.allowanceOther ?? 0,
    notes: editing?.notes ?? '',
  })

  const set = (k: keyof typeof form, v: unknown) => setForm(f => ({ ...f, [k]: v }))
  const isIndefinite = form.contractType === 'INDEFINITE'

  const mut = useMutation({
    mutationFn: (dto: CreateContractDto) =>
      editing ? updateContract(editing.id, dto) : createContract(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts', employeeId] })
      qc.invalidateQueries({ queryKey: ['contracts-expiring'] })
      onClose()
    },
  })

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'contracts')
      const res = await apiFetch<{ url: string; name: string }>('/api/files/upload', { method: 'POST', body: fd })
      setAttachment({ url: res.url, name: res.name ?? file.name })
    } finally {
      setUploading(false)
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    mut.mutate({
      employeeId,
      ...form,
      endDate: isIndefinite ? undefined : (form.endDate || undefined),
      attachmentUrl:  attachment?.url,
      attachmentName: attachment?.name,
    })
  }

  if (!open) return null

  const totalSalary = ((form.baseSalary ?? 0) * (form.salaryCoefficient ?? 1))
    + (form.allowancePosition ?? 0)
    + (form.allowanceSeniority ?? 0)
    + (form.allowanceOther ?? 0)

  return (
    <ResizableModal onClose={onClose} defaultWidth={700} defaultHeight={560}>
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {editing ? 'Chỉnh sửa hợp đồng' : 'Tạo hợp đồng lao động'}
            </h2>
            {employeeName && <p className="text-sm text-gray-500">{employeeName}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto">
        <form onSubmit={submit} className="px-6 py-5 space-y-5">
          {/* Số hợp đồng + loại */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Số hợp đồng *</label>
              <input required value={form.contractNumber} onChange={e => set('contractNumber', e.target.value)}
                placeholder="VD: HĐ-2026-001"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Loại hợp đồng *</label>
              <select value={form.contractType} onChange={e => set('contractType', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {CONTRACT_TYPES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          {/* Ngày */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ngày ký *</label>
              <input required type="date" value={form.signDate} onChange={e => set('signDate', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ngày bắt đầu *</label>
              <input required type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ngày kết thúc</label>
              <input type="date" value={form.endDate ?? ''} onChange={e => set('endDate', e.target.value)}
                disabled={isIndefinite}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400" />
              {isIndefinite && <p className="text-xs text-gray-400 mt-0.5">Không xác định thời hạn</p>}
            </div>
          </div>

          {/* Chức danh + phòng ban + người ký */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Chức danh</label>
              <input value={form.position ?? ''} onChange={e => set('position', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Đơn vị</label>
              <input value={form.departmentName ?? ''} onChange={e => set('departmentName', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Người ký (đại diện bệnh viện)</label>
            <input value={form.signerName ?? ''} onChange={e => set('signerName', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Lương */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Thông tin lương</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Lương cơ bản (VNĐ)</label>
                <input type="number" value={form.baseSalary ?? ''} onChange={e => set('baseSalary', e.target.value ? +e.target.value : undefined)}
                  placeholder="2.340.000"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Ngạch / bậc</label>
                <input value={form.salaryGrade ?? ''} onChange={e => set('salaryGrade', e.target.value)}
                  placeholder="VD: BS.III/5"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Hệ số lương</label>
                <input type="number" step="0.001" value={form.salaryCoefficient ?? ''} onChange={e => set('salaryCoefficient', e.target.value ? +e.target.value : undefined)}
                  placeholder="VD: 2.67"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">PC chức vụ</label>
                <input type="number" value={form.allowancePosition ?? ''} onChange={e => set('allowancePosition', +e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">PC thâm niên</label>
                <input type="number" value={form.allowanceSeniority ?? ''} onChange={e => set('allowanceSeniority', +e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">PC khác</label>
                <input type="number" value={form.allowanceOther ?? ''} onChange={e => set('allowanceOther', +e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              </div>
            </div>
            {totalSalary > 0 && (
              <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                <span className="text-xs text-gray-500">Tổng lương ước tính</span>
                <span className="text-sm font-bold text-blue-700">
                  {totalSalary.toLocaleString('vi-VN')} ₫
                </span>
              </div>
            )}
          </div>

          {/* File đính kèm */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Đính kèm hợp đồng (scan PDF)</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
            >
              {attachment?.name ? (
                <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a3 3 0 016 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd"/>
                  </svg>
                  <span className="font-medium">{attachment.name}</span>
                  <button type="button" onClick={e => { e.stopPropagation(); setAttachment(null) }}
                    className="text-gray-400 hover:text-red-500 ml-1">×</button>
                </div>
              ) : uploading ? (
                <span className="text-sm text-gray-400">Đang upload...</span>
              ) : (
                <span className="text-sm text-gray-400">↑ Chọn file PDF / ảnh (tối đa 10 MB)</span>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFile} className="hidden" />
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ghi chú</label>
            <textarea rows={2} value={form.notes ?? ''} onChange={e => set('notes', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          {mut.isError && (
            <p className="text-sm text-red-500">{(mut.error as Error)?.message ?? 'Có lỗi xảy ra'}</p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50">
              Hủy
            </button>
            <button type="submit" disabled={mut.isPending}
              className="px-5 py-2 text-sm font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg disabled:opacity-50">
              {mut.isPending ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo hợp đồng'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </ResizableModal>
  )
}
