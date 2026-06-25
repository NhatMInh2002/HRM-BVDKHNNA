'use client'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRoles } from '@/hooks/useRoles'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, differenceInBusinessDays, addDays } from 'date-fns'
import {
  getMyLeaveRequests,
  getPendingLeaveRequests,
  createLeaveRequest,
  approveLeave,
  rejectLeave,
  LEAVE_TYPE_LABELS,
  LEAVE_TYPE_META,
  LEAVE_TYPE_GROUPS,
  LEAVE_STATUS_LABELS,
  type LeaveType,
  type LeaveStatus,
} from '@/lib/attendance'
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee'
import { Badge } from '@/components/ui/badge'

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

const STATUS_VARIANT: Record<LeaveStatus, 'yellow' | 'green' | 'red'> = {
  PENDING: 'yellow', APPROVED: 'green', REJECTED: 'red',
}

function countWorkdays(start: string, end: string): number {
  if (!start || !end || end < start) return 0
  // Đếm ngày dương lịch (đơn giản), không trừ lễ — có thể cải thiện sau
  const s = new Date(start)
  const e = new Date(end)
  let count = 0
  const cur = new Date(s)
  while (cur <= e) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

export default function LeavePage() {
  const { canApproveLeave: canApprove } = useRoles()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [tab, setTab] = useState<'my' | 'pending'>('my')

  useEffect(() => { if (canApprove) setTab('pending') }, [canApprove])

  const { data: me } = useCurrentEmployee()

  const { data: myRequests = [], isLoading: loadingMy } = useQuery({
    queryKey: ['my-leave', me?.id],
    queryFn: () => getMyLeaveRequests(me!.id),
    enabled: tab === 'my' && !!me?.id,
  })
  const { data: pendingRequests = [], isLoading: loadingPending } = useQuery({
    queryKey: ['pending-leave'],
    queryFn: getPendingLeaveRequests,
    enabled: tab === 'pending' && canApprove,
  })

  const approveMut = useMutation({
    mutationFn: approveLeave,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pending-leave'] }),
  })
  const rejectMut = useMutation({
    mutationFn: rejectLeave,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pending-leave'] }),
  })

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { leaveType: 'ANNUAL' },
  })

  const createMut = useMutation({
    mutationFn: (values: FormValues) => createLeaveRequest({ employeeId: me!.id, ...values }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-leave'] }); setShowForm(false); reset() },
  })

  const watchedType  = watch('leaveType')
  const watchedStart = watch('startDate')
  const watchedEnd   = watch('endDate')
  const meta         = LEAVE_TYPE_META[watchedType]
  const workdays     = countWorkdays(watchedStart, watchedEnd)
  const overLimit    = meta.maxDays !== undefined && workdays > meta.maxDays

  const rows      = tab === 'my' ? myRequests : pendingRequests
  const isLoading = tab === 'my' ? loadingMy  : loadingPending

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Nghỉ phép</h1>
          <p className="text-sm text-gray-500 mt-0.5">{rows.length} đơn</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          disabled={!me}
          className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
        >
          + Tạo đơn nghỉ
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {canApprove && (
          <button
            onClick={() => setTab('pending')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'pending' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Chờ duyệt
            {pendingRequests.length > 0 && (
              <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-1.5 py-0.5 rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </button>
        )}
        <button
          onClick={() => setTab('my')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'my' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Đơn của tôi
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Nhân viên</th>
              <th className="px-4 py-3 text-left">Loại nghỉ</th>
              <th className="px-4 py-3 text-left">Từ ngày</th>
              <th className="px-4 py-3 text-left">Đến ngày</th>
              <th className="px-4 py-3 text-left">Số ngày</th>
              <th className="px-4 py-3 text-left">Lý do</th>
              <th className="px-4 py-3 text-left">Trạng thái</th>
              {canApprove && tab === 'pending' && <th className="px-4 py-3 text-right">Thao tác</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">Đang tải...</td></tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">Không có đơn nào.</td></tr>
            )}
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-xs text-gray-500 font-mono">{r.createdBy}</td>
                <td className="px-4 py-3 text-gray-700">
                  {LEAVE_TYPE_LABELS[r.leaveType] ?? r.leaveType}
                </td>
                <td className="px-4 py-3 text-gray-600">{format(new Date(r.startDate), 'dd/MM/yyyy')}</td>
                <td className="px-4 py-3 text-gray-600">{format(new Date(r.endDate), 'dd/MM/yyyy')}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{r.totalDays}</td>
                <td className="px-4 py-3 text-gray-500 text-xs max-w-[160px] truncate">{r.reason ?? '—'}</td>
                <td className="px-4 py-3">
                  <Badge label={LEAVE_STATUS_LABELS[r.status]} variant={STATUS_VARIANT[r.status]} />
                </td>
                {canApprove && tab === 'pending' && (
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => approveMut.mutate(r.id)}
                      disabled={approveMut.isPending}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded
                        bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 disabled:opacity-50"
                    >
                      Duyệt
                    </button>
                    <button
                      onClick={() => rejectMut.mutate(r.id)}
                      disabled={rejectMut.isPending}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded
                        bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 disabled:opacity-50"
                    >
                      Từ chối
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal tạo đơn */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Tạo đơn xin nghỉ</h2>
              <button onClick={() => { setShowForm(false); reset() }}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <form onSubmit={handleSubmit(d => createMut.mutate(d))} className="px-6 py-5 space-y-4">
              {me && (
                <p className="text-sm text-gray-600 bg-blue-50 rounded-lg px-3 py-2">
                  Người nộp đơn: <span className="font-semibold">{me.fullName}</span>
                  <span className="text-gray-400 ml-1">({me.employeeCode})</span>
                </p>
              )}

              {/* Loại nghỉ — dropdown có nhóm */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Loại nghỉ *</label>
                <select
                  {...register('leaveType')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {LEAVE_TYPE_GROUPS.map(({ group, types }) => (
                    <optgroup key={group} label={group}>
                      {types.map(t => (
                        <option key={t} value={t}>{LEAVE_TYPE_LABELS[t]}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Info card — hiện theo loại đã chọn */}
              <div className={`rounded-lg px-4 py-3 text-xs space-y-1 border ${
                meta.paid ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}>
                <div className="flex items-center gap-2 font-medium">
                  <span>{meta.paid ? '✅ Nghỉ có lương' : '⚠️ Nghỉ không lương'}</span>
                  {meta.maxDays && (
                    <span className="ml-auto bg-white/70 rounded px-1.5 py-0.5 border border-current/20">
                      Tối đa {meta.maxDays} ngày theo quy định
                    </span>
                  )}
                </div>
                {meta.requiresDoc && (
                  <div className="flex items-start gap-1.5 text-orange-700">
                    <span className="mt-0.5">📎</span>
                    <span>Cần nộp: <strong>{meta.requiresDoc}</strong></span>
                  </div>
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

              {/* Số ngày preview */}
              {workdays > 0 && (
                <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
                  overLimit
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                  <span>
                    <strong>{workdays} ngày làm việc</strong>
                    {overLimit && (
                      <span className="ml-1">
                        — vượt quá quy định ({meta.maxDays} ngày). Vui lòng liên hệ Phòng Tổ chức.
                      </span>
                    )}
                  </span>
                </div>
              )}

              {/* Lý do */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Lý do / ghi chú
                  {['ANNUAL','COMPENSATORY','UNPAID'].includes(watchedType) && (
                    <span className="text-gray-400 font-normal ml-1">(bắt buộc)</span>
                  )}
                </label>
                <textarea
                  {...register('reason')}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={
                    watchedType === 'SICK' ? 'VD: Sốt, cảm cúm — đã có giấy BHXH' :
                    watchedType === 'ANNUAL' ? 'VD: Nghỉ phép theo kế hoạch' :
                    watchedType === 'COMPENSATORY' ? 'VD: Bù ngày làm thêm ngày 20/06' :
                    'Ghi rõ lý do...'
                  }
                />
              </div>

              {createMut.error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {(createMut.error as Error).message}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => { setShowForm(false); reset() }}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createMut.isPending || !me || overLimit}
                  className="px-4 py-2 text-sm text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60"
                >
                  {createMut.isPending ? 'Đang gửi...' : 'Gửi đơn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
