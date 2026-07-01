'use client'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

/**
 * Bọc nội dung modal và render ra thẳng document.body qua portal.
 * Tránh lỗi backdrop không phủ được header/sidebar khi modal render bên trong
 * <main> (fixed inset-0 vẫn bị "kẹt" dưới header trong cây DOM/stacking context).
 *
 * Truyền children là toàn bộ lớp overlay (thường là <div className="fixed inset-0 ...">).
 */
export function ModalPortal({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  useEffect(() => {
    if (!onClose) return
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  if (typeof document === 'undefined') return null
  return createPortal(children, document.body)
}
