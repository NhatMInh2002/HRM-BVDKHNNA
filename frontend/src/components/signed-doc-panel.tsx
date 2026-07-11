'use client'
import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSignedDoc, uploadSignedDoc, type SignedDocType } from '@/lib/signed-docs'

/**
 * Ô "Bản đã ký" dùng chung cho phiếu lương / sơ yếu lý lịch HS02...
 * - Nếu đã có bản ký: hiện link "Xem bản đã ký".
 * - Nếu được phép (canUpload): nút "Tải lên bản đã ký" (chọn PDF đã ký từ máy).
 *
 * Bản đã ký = PDF do hệ thống sinh, người dùng ký/đóng dấu bằng công cụ ngoài
 * (KillerPDF, ký số USB...) rồi tải lên đây lưu trữ.
 */
export function SignedDocPanel({
  type, refId, canUpload = false, compact = false,
}: {
  type: SignedDocType
  refId: string
  canUpload?: boolean
  compact?: boolean
}) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [err, setErr] = useState('')

  const queryKey = ['signed-doc', type, refId]
  const { data } = useQuery({ queryKey, queryFn: () => getSignedDoc(type, refId) })

  const upload = useMutation({
    mutationFn: (file: File) => uploadSignedDoc(type, refId, file),
    onSuccess: () => { setErr(''); qc.invalidateQueries({ queryKey }) },
    onError: (e: Error) => setErr(e.message),
  })

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // cho phép chọn lại cùng file
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf')) { setErr('Chỉ chấp nhận file PDF'); return }
    upload.mutate(file)
  }

  const viewUrl = data?.exists ? `/api${data.url.replace(/^\/api/, '')}` : ''

  return (
    <div className={compact ? 'flex items-center gap-2' : 'flex flex-col gap-1.5'}>
      {data?.exists ? (
        <a
          href={viewUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-green-700 hover:underline"
          title="Mở bản PDF đã ký"
        >
          ✅ Xem bản đã ký
        </a>
      ) : (
        !compact && <span className="text-xs text-gray-400">Chưa có bản đã ký</span>
      )}

      {canUpload && (
        <>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={upload.isPending}
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
            title="Tải lên bản PDF đã ký/đóng dấu"
          >
            {upload.isPending ? '⏳ Đang tải...' : (data?.exists ? '↻ Thay bản đã ký' : '🖊 Tải lên bản đã ký')}
          </button>
          <input ref={fileRef} type="file" accept="application/pdf,.pdf" hidden onChange={onPick} />
        </>
      )}

      {err && <span className="text-xs text-red-500">{err}</span>}
    </div>
  )
}
