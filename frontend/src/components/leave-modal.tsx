'use client'
import { useEffect, useRef, useState } from 'react'
import { ResizableModal } from '@/components/resizable-modal'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createLeaveRequest,
  LEAVE_TYPE_LABELS,
  LEAVE_TYPE_META,
  LEAVE_TYPE_GROUPS,
  type LeaveType,
} from '@/lib/attendance'
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee'
import { apiFetch } from '@/lib/api'

const ALL_LEAVE_TYPES = Object.keys(LEAVE_TYPE_META) as LeaveType[]

const schema = z.object({
  leaveType: z.enum(ALL_LEAVE_TYPES as [LeaveType, ...LeaveType[]]),
  startDate: z.string().min(1, 'Bắt buộc'),
  endDate:   z.string().min(1, 'Bắt buộc'),
  reason:    z.string().optional(),
}).refine(d => d.endDate >= d.startDate, {
  message: 'Ngày kết thúc phải sau ngày bắt đầu',
  path: ['endDate'],
})

type FormValues = z.infer<typeof schema>

function countWorkdays(start: string, end: string) {
  if (!start || !end || end < start) return 0
  const cur = new Date(start)
  const last = new Date(end)
  let count = 0
  while (cur <= last) {
    const d = cur.getDay()
    if (d !== 0 && d !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

interface Props {
  open: boolean
  onClose: () => void
}

export function LeaveModal({ open, onClose }: Props) {
  const qc = useQueryClient()
  const { data: me } = useCurrentEmployee()
  const fileRef = useRef<HTMLInputElement>(null)
  const [attachment, setAttachment] = useState<{ url: string; name: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { leaveType: 'ANNUAL' },
  })

  const createMut = useMutation({
    mutationFn: (values: FormValues) => createLeaveRequest({
      employeeId: me!.id,
      ...values,
      attachmentUrl: attachment?.url,
      attachmentName: attachment?.name,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-leave'] })
      onClose()
      reset()
      setAttachment(null)
    },
  })

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File tối đa 10 MB')
      return
    }
    setUploadError(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'leave')
      const res = await apiFetch<{ url: string; name: string }>('/files/upload', {
        method: 'POST',
        body: fd,
      })
      setAttachment({ url: res.url, name: res.name ?? file.name })
    } catch {
      setUploadError('Upload thất bại, thử lại')
    } finally {
      setUploading(false)
    }
  }

  // Đóng khi nhấn Escape
  useEffect(() => {
    if (!open) return
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); reset(); setAttachment(null); setUploadError(null) }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [open, onClose, reset])

  if (!open) return null

  const watchedType  = watch('leaveType')
  const watchedStart = watch('startDate')
  const watchedEnd   = watch('endDate')
  const meta         = LEAVE_TYPE_META[watchedType]
  const workdays     = countWorkdays(watchedStart, watchedEnd)
  const overLimit    = meta.maxDays !== undefined && workdays > meta.maxDays

  return (
    <ResizableModal onClose={() => { onClose(); reset(); setAttachment(null); setUploadError(null) }} defaultWidth={540} defaultHeight={580}>
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Tạo đơn xin nghỉ</h2>
          <button onClick={() => { onClose(); reset(); setAttachment(null); setUploadError(null) }}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit(d => createMut.mutate(d))} className="px-6 py-5 space-y-4">
          {me && (
            <p className="text-sm text-gray-600 bg-blue-50 rounded-lg px-3 py-2">
              Người nộp đơn: <span className="font-semibold">{me.fullName}</span>
              <span className="text-gray-400 ml-1">({me.employeeCode})</span>
            </p>
          )}

          {/* Loại nghỉ */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Loại nghỉ *</label>
            <select
              {...register('leaveType')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {LEAVE_TYPE_GROUPS.map(({ group, types }) => (
                <optgroup key={group} label={group}>
                  {types.map(t => <option key={t} value={t}>{LEAVE_TYPE_LABELS[t]}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Info card */}
          <div className={`rounded-lg px-4 py-3 text-xs space-y-1 border ${
            meta.paid ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-600'
          }`}>
            <div className="flex items-center gap-2 font-medium">
              <span>{meta.paid ? '✅ Nghỉ có lương' : '⚠️ Nghỉ không lương'}</span>
              {meta.maxDays && (
                <span className="ml-auto bg-white/70 rounded px-1.5 py-0.5">
                  Tối đa {meta.maxDays} ngày
                </span>
              )}
            </div>
            {meta.requiresDoc && (
              <div className="text-orange-700">📎 Cần nộp: <strong>{meta.requiresDoc}</strong></div>
            )}
          </div>

          {/* Ngày */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Từ ngày *</label>
              <input {...register('startDate')} type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Đến ngày *</label>
              <input {...register('endDate')} type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate.message}</p>}
            </div>
          </div>

          {/* Preview số ngày */}
          {workdays > 0 && (
            <div className={`text-sm rounded-lg px-3 py-2 border ${
              overLimit ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              <strong>{workdays} ngày làm việc</strong>
              {overLimit && <span className="ml-1">— vượt quy định ({meta.maxDays} ngày)</span>}
            </div>
          )}

          {/* Đính kèm tài liệu */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Đính kèm tài liệu
              {meta.requiresDoc && (
                <span className="text-orange-600 font-normal ml-1">(khuyến nghị: {meta.requiresDoc})</span>
              )}
            </label>
            <input ref={fileRef} type="file" className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileChange} />
            {attachment ? (
              <div className="flex items-center gap-2 px-3 py-2 border border-green-200 bg-green-50 rounded-lg text-sm text-green-800">
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a3 3 0 016 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd"/>
                </svg>
                <span className="truncate flex-1">{attachment.name}</span>
                <button type="button" onClick={() => { setAttachment(null); if (fileRef.current) fileRef.current.value = '' }}
                  className="text-green-600 hover:text-red-600 font-medium text-xs ml-auto flex-shrink-0">
                  Xóa
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-full flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50">
                {uploading ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                  </svg>
                )}
                {uploading ? 'Đang tải lên...' : 'Chọn file (PDF, ảnh, Word — tối đa 10 MB)'}
              </button>
            )}
            {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
          </div>

          {/* Lý do */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Lý do / ghi chú</label>
            <textarea
              {...register('reason')}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập lý do nghỉ..."
            />
          </div>

          {createMut.isError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {(createMut.error as Error)?.message ?? 'Gửi đơn thất bại'}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { onClose(); reset(); setAttachment(null); setUploadError(null) }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50">
              Hủy
            </button>
            <button type="submit" disabled={createMut.isPending || !me}
              className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50">
              {createMut.isPending ? 'Đang gửi...' : 'Gửi đơn'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </ResizableModal>
  )
}
