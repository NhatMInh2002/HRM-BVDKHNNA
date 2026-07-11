'use client'
import { ModalPortal } from '@/components/modal-portal'

/**
 * Hộp thoại xác nhận dùng chung — thay cho window.confirm() (xấu, không nhất quán,
 * không hỗ trợ tiếng Việt tốt trên mọi trình duyệt). Dùng cho hành động không thể
 * hoàn tác hoặc cần cân nhắc (cho thôi việc, xóa danh mục, đóng tin tuyển dụng...).
 *
 * Cách dùng: quản lý state mở/đóng ở component cha, render <ConfirmDialog open={...} />.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null

  const confirmCls = variant === 'danger'
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-blue-600 hover:bg-blue-700'
  const icon = variant === 'danger' ? '⚠️' : '❓'

  return (
    <ModalPortal onClose={loading ? undefined : onCancel}>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={loading ? undefined : onCancel}
      >
        <div
          className="w-full max-w-md rounded-xl bg-white shadow-2xl"
          onClick={e => e.stopPropagation()}
          role="alertdialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className="flex items-start gap-3 px-6 pt-6">
            <span className="text-2xl leading-none" aria-hidden>{icon}</span>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900">{title}</h3>
              {message && (
                <div className="mt-1.5 text-sm text-gray-600 whitespace-pre-line">{message}</div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 mt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50 ${confirmCls}`}
            >
              {loading ? 'Đang xử lý...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}
