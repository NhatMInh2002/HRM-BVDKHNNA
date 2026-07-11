import { apiFetch } from './api'

export type SignedDocType = 'payslip' | 'hs02' | 'leave'

export interface SignedDocStatus {
  exists: boolean
  url: string
}

/** Trạng thái bản đã ký của một văn bản (có/không + URL xem). */
export const getSignedDoc = (type: SignedDocType, refId: string) =>
  apiFetch<SignedDocStatus>(`/signed-docs/${type}/${refId}`)

/** Tải lên bản PDF đã ký (multipart). Trả về URL xem của bản vừa lưu. */
export async function uploadSignedDoc(type: SignedDocType, refId: string, file: File) {
  const fd = new FormData()
  fd.append('file', file)
  return apiFetch<{ url: string }>(`/signed-docs/${type}/${refId}`, {
    method: 'POST',
    body: fd,
  })
}
