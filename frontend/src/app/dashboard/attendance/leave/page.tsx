'use client'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import {
  getMyLeaveRequests,
  getDeptPendingLeave,
  getHrPendingLeave,
  deptApproveLeave,
  deptRejectLeave,
  hrApproveLeave,
  hrRejectLeave,
  LEAVE_TYPE_LABELS,
  LEAVE_STATUS_LABELS,
  type LeaveRequest,
  type LeaveStatus,
} from '@/lib/attendance'
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee'
import { useRoles } from '@/hooks/useRoles'
import { Badge } from '@/components/ui/badge'
import { LeaveModal } from '@/components/leave-modal'
import { ModalPortal } from '@/components/modal-portal'

/** Chuyển bất kỳ URL file nào về /api/files/view?key= */
function toViewUrl(raw: string): string {
  if (!raw) return raw
  if (raw.startsWith('/api/files/view')) return raw
  let key = raw
  if (raw.startsWith('http')) {
    try {
      const u = new URL(raw)
      key = u.pathname.replace(/^\/[^/]+\//, '') // bỏ /bucket-name/ prefix
    } catch { /* keep raw */ }
  }
  key = key.replace(/^hrm-avatars\//, '')
  return `/api/files/view?key=${encodeURIComponent(key)}`
}

const STATUS_VARIANT: Record<LeaveStatus, 'yellow' | 'green' | 'red' | 'blue'> = {
  PENDING: 'yellow', DEPT_APPROVED: 'blue', APPROVED: 'green', REJECTED: 'red',
}

type Tab = 'my' | 'dept' | 'hr'

export default function LeavePage() {
  const { data: session } = useSession()
  const { canApproveLeave } = useRoles()
  const { data: me } = useCurrentEmployee()
  const qc = useQueryClient()

  const role = (session as any)?.role as string | undefined
  // Duyệt cấp 1: trưởng khoa/phòng (DEPT_HEAD) hoặc điều dưỡng trưởng (NURSE_MANAGER)
  const isDeptHead = role === 'DEPT_HEAD' || role === 'NURSE_MANAGER' || role === 'ADMIN'
  const isNurse = role === 'NURSE_MANAGER'
  const isHr = role === 'HR_MANAGER' || role === 'ADMIN'

  const [tab, setTab] = useState<Tab>('my')
  const [showForm, setShowForm] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<{ id: string; level: 'dept' | 'hr' } | null>(null)
  const [rejectNote, setRejectNote] = useState('')

  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [blobType, setBlobType] = useState<string>('application/pdf')
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    if (isDeptHead) setTab('dept')
    else if (isHr) setTab('hr')
  }, [isDeptHead, isHr])

  // Queries
  const { data: myRequests = [], isLoading: loadingMy } = useQuery({
    queryKey: ['my-leave', me?.id],
    queryFn: () => getMyLeaveRequests(me!.id),
    enabled: tab === 'my' && !!me?.id,
  })
  const { data: deptRequests = [], isLoading: loadingDept } = useQuery({
    queryKey: ['dept-leave'],
    queryFn: getDeptPendingLeave,
    enabled: tab === 'dept' && isDeptHead,
  })
  const { data: hrRequests = [], isLoading: loadingHr } = useQuery({
    queryKey: ['hr-leave'],
    queryFn: getHrPendingLeave,
    enabled: tab === 'hr' && isHr,
  })

  // Duyệt/từ chối ở 1 cấp đều làm thay đổi danh sách hiển thị ở CẢ HAI cấp
  // (vd: duyệt cấp 1 xong thì đơn đó phải xuất hiện ngay ở danh sách cấp 2) —
  // và ảnh hưởng widget "đơn chờ duyệt" trên dashboard. staleTime mặc định 30s
  // (providers.tsx) khiến cache cũ vẫn hiển thị nếu không invalidate đủ key.
  const invalidateLeaveQueries = () => {
    qc.invalidateQueries({ queryKey: ['dept-leave'] })
    qc.invalidateQueries({ queryKey: ['hr-leave'] })
    qc.invalidateQueries({ queryKey: ['dashboard-hr-pending-leave'] })
  }

  // Mutations — trưởng phòng
  const deptApproveMut = useMutation({
    mutationFn: deptApproveLeave,
    onSuccess: invalidateLeaveQueries,
  })
  const deptRejectMut = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => deptRejectLeave(id, note),
    onSuccess: () => { invalidateLeaveQueries(); setRejectTarget(null) },
  })

  // Mutations — TCCB
  const hrApproveMut = useMutation({
    mutationFn: hrApproveLeave,
    onSuccess: invalidateLeaveQueries,
  })
  const hrRejectMut = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => hrRejectLeave(id, note),
    onSuccess: () => { invalidateLeaveQueries(); setRejectTarget(null) },
  })

  const rows = tab === 'my' ? myRequests : tab === 'dept' ? deptRequests : hrRequests
  const isLoading = tab === 'my' ? loadingMy : tab === 'dept' ? loadingDept : loadingHr

  async function openPreview(rawUrl: string) {
    const viewUrl = toViewUrl(rawUrl)
    setPreviewUrl(viewUrl)
    setPreviewLoading(true)
    setBlobUrl(null)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000) // tránh treo vô hạn nếu storage chậm/đứng
    try {
      const res = await fetch(viewUrl, {
        headers: { Authorization: `Bearer ${session?.accessToken ?? ''}` },
        signal: controller.signal,
      })
      if (!res.ok) { setBlobUrl(null); return }
      const blob = await res.blob()
      setBlobType(blob.type || 'application/octet-stream')
      setBlobUrl(URL.createObjectURL(blob))
    } catch { setBlobUrl(null) }
    finally { clearTimeout(timeout); setPreviewLoading(false) }
  }

  function closePreview() {
    if (blobUrl) URL.revokeObjectURL(blobUrl)
    setPreviewUrl(null)
    setBlobUrl(null)
  }

  const tabs: { key: Tab; label: string; show: boolean; count?: number }[] = [
    { key: 'my', label: 'Đơn của tôi', show: true },
    { key: 'dept', label: isNurse ? 'Duyệt cấp 1 (Điều dưỡng trưởng)' : 'Duyệt cấp 1 (Trưởng khoa/phòng)', show: isDeptHead, count: deptRequests.length },
    { key: 'hr', label: 'Duyệt cấp 2 (TCCB)', show: isHr, count: hrRequests.length },
  ]

  const showActions = (tab === 'dept' && isDeptHead) || (tab === 'hr' && isHr)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Nghỉ phép</h1>
          <p className="text-sm text-gray-500 mt-0.5">{rows.length} đơn</p>
        </div>
        {tab === 'my' && (
          <button
            onClick={() => setShowForm(true)}
            disabled={!me}
            className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
          >
            + Tạo đơn nghỉ
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {tabs.filter(t => t.show).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {t.count != null && t.count > 0 && (
              <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              {showActions && <th className="px-4 py-3 text-left">Nhân viên</th>}
              <th className="px-4 py-3 text-left">Loại nghỉ</th>
              <th className="px-4 py-3 text-left">Từ ngày</th>
              <th className="px-4 py-3 text-left">Đến ngày</th>
              <th className="px-4 py-3 text-left">Số ngày</th>
              <th className="px-4 py-3 text-left">Lý do</th>
              <th className="px-4 py-3 text-left">File</th>
              <th className="px-4 py-3 text-left">Trạng thái</th>
              {showActions && <th className="px-4 py-3 text-right">Thao tác</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400">Đang tải...</td></tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                {tab === 'my' ? 'Bạn chưa có đơn nghỉ nào.' : 'Không có đơn nào chờ duyệt.'}
              </td></tr>
            )}
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                {showActions && (
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800 text-xs">{r.employeeName ?? r.createdBy}</div>
                    {r.employeeCode && <div className="text-gray-400 text-xs">{r.employeeCode}</div>}
                  </td>
                )}
                <td className="px-4 py-3 font-medium text-gray-800">{LEAVE_TYPE_LABELS[r.leaveType] ?? r.leaveType}</td>
                <td className="px-4 py-3 text-gray-600">{format(new Date(r.startDate), 'dd/MM/yyyy')}</td>
                <td className="px-4 py-3 text-gray-600">{format(new Date(r.endDate), 'dd/MM/yyyy')}</td>
                <td className="px-4 py-3 font-semibold text-gray-800">{r.totalDays}</td>
                <td className="px-4 py-3 text-gray-500 text-xs max-w-[120px] truncate">{r.reason ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {r.attachmentUrl && (
                      <button onClick={() => openPreview(r.attachmentUrl!)}
                        title="Xem file đính kèm"
                        className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <EyeIcon />
                      </button>
                    )}
                    {r.pdfUrl && (
                      <button onClick={() => openPreview(r.pdfUrl!)}
                        title="Xem PDF quyết định"
                        className="p-1 rounded text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                        <PdfIcon />
                      </button>
                    )}
                    {!r.attachmentUrl && !r.pdfUrl && <span className="text-gray-300 text-xs">—</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge label={LEAVE_STATUS_LABELS[r.status] ?? r.status} variant={STATUS_VARIANT[r.status] ?? 'yellow'} />
                  {r.status === 'REJECTED' && (r.deptRejectNote || r.hrRejectNote) && (
                    <p className="text-xs text-red-500 mt-0.5 max-w-[120px] truncate">
                      {r.deptRejectNote ?? r.hrRejectNote}
                    </p>
                  )}
                </td>
                {showActions && (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => tab === 'dept' ? deptApproveMut.mutate(r.id) : hrApproveMut.mutate(r.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold
                          bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-all"
                      >
                        <CheckIcon /> Duyệt
                      </button>
                      <button
                        onClick={() => { setRejectTarget({ id: r.id, level: tab as 'dept' | 'hr' }); setRejectNote('') }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold
                          bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-400 transition-all"
                      >
                        <XIcon /> Từ chối
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <LeaveModal open={showForm} onClose={() => setShowForm(false)} />

      {/* Modal từ chối */}
      {rejectTarget && (
        <ModalPortal onClose={() => setRejectTarget(null)}>
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Lý do từ chối</h3>
            <p className="text-sm text-gray-500 mb-4">Nhập lý do từ chối đơn nghỉ phép này</p>
            <textarea
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              rows={3}
              placeholder="Ví dụ: Thiếu nhân lực trong thời gian này..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setRejectTarget(null)}
                className="flex-1 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">
                Hủy
              </button>
              <button
                onClick={() => {
                  if (rejectTarget.level === 'dept') {
                    deptRejectMut.mutate({ id: rejectTarget.id, note: rejectNote })
                  } else {
                    hrRejectMut.mutate({ id: rejectTarget.id, note: rejectNote })
                  }
                }}
                disabled={deptRejectMut.isPending || hrRejectMut.isPending}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50"
              >
                {deptRejectMut.isPending || hrRejectMut.isPending ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Modal xem trước file */}
      {previewUrl && (
        <ModalPortal onClose={closePreview}>
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={closePreview}>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
               onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-700">Xem trước file</p>
              <div className="flex items-center gap-2">
                {blobUrl && (
                  <a href={blobUrl} download className="text-xs text-blue-600 hover:underline px-2 py-1">
                    Tải xuống ↓
                  </a>
                )}
                <button onClick={closePreview} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100">
                  <XIcon />
                </button>
              </div>
            </div>
            <div className="overflow-auto max-h-[80vh] flex items-center justify-center bg-gray-50 p-4 min-h-[300px]">
              {previewLoading ? (
                <div className="text-gray-400 text-sm flex flex-col items-center gap-2">
                  <SpinnerIcon />
                  Đang tải file...
                </div>
              ) : blobUrl ? (
                blobType.startsWith('image/') ? (
                  <img src={blobUrl} alt="Đính kèm" className="max-w-full max-h-[75vh] object-contain rounded-lg shadow" />
                ) : (
                  <iframe src={blobUrl} className="w-full h-[75vh] rounded-lg border-0" title="Xem trước file" />
                )
              ) : (
                <p className="text-red-500 text-sm">Không thể tải file. Vui lòng thử lại.</p>
              )}
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  )
}

function EyeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
    </svg>
  )
}

function PdfIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
    </svg>
  )
}

function XIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  )
}
