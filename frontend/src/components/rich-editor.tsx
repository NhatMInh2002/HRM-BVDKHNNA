'use client'
import { useRef, useCallback, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

interface RichEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

// ── Toolbar button component ───────────────────────────────────────────────
function Btn({
  onClick, title, active, children,
}: { onClick: () => void; title: string; active?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors
        ${active
          ? 'bg-blue-600 text-white'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
    >
      {children}
    </button>
  )
}

function Sep() {
  return <div className="w-px h-6 bg-gray-200 mx-1" />
}

// ── Main editor ────────────────────────────────────────────────────────────
export function RichEditor({ value, onChange, placeholder = 'Nhập nội dung...', minHeight = 200 }: RichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const isComposing = useRef(false)

  // Sync value vào DOM khi mount hoặc khi value thay đổi từ bên ngoài
  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    if (el.innerHTML !== value) {
      el.innerHTML = value || ''
    }
  }, [value])

  const emitChange = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  const exec = useCallback((cmd: string, val?: string) => {
    document.execCommand(cmd, false, val)
    editorRef.current?.focus()
    emitChange()
  }, [emitChange])

  const isActive = (cmd: string, val?: string) => {
    try { return document.queryCommandState(cmd) } catch { return false }
  }

  // Upload ảnh lên MinIO
  const handleImageFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await apiFetch<{ url: string }>('/files/upload', { method: 'POST', body: fd })
      const url = res?.url || ''
      if (url) {
        exec('insertImage', url)
      }
    } catch {
      // Fallback: embed as data URL nếu upload thất bại
      const reader = new FileReader()
      reader.onload = e => { if (e.target?.result) exec('insertImage', e.target.result as string) }
      reader.readAsDataURL(file)
    }
  }, [exec])

  // Dán ảnh từ clipboard
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items)
    const imageItem = items.find(i => i.type.startsWith('image/'))
    if (imageItem) {
      e.preventDefault()
      const file = imageItem.getAsFile()
      if (file) await handleImageFile(file)
    }
  }, [handleImageFile])

  // Kéo thả ảnh vào editor
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length > 0) {
      e.preventDefault()
      for (const f of files) await handleImageFile(f)
    }
  }, [handleImageFile])

  const insertLink = () => {
    const selection = window.getSelection()
    const selectedText = selection?.toString() || ''
    const url = prompt('Nhập URL liên kết:', 'https://')
    if (url) {
      if (selectedText) {
        exec('createLink', url)
      } else {
        const a = `<a href="${url}" target="_blank" rel="noopener">${url}</a>`
        exec('insertHTML', a)
      }
    }
  }

  const insertTable = () => {
    const table = `
<table style="width:100%;border-collapse:collapse;margin:8px 0">
  <thead>
    <tr>
      <th style="border:1px solid #e5e7eb;padding:8px 12px;background:#f9fafb;text-align:left">Tiêu đề 1</th>
      <th style="border:1px solid #e5e7eb;padding:8px 12px;background:#f9fafb;text-align:left">Tiêu đề 2</th>
      <th style="border:1px solid #e5e7eb;padding:8px 12px;background:#f9fafb;text-align:left">Tiêu đề 3</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid #e5e7eb;padding:8px 12px">Nội dung</td>
      <td style="border:1px solid #e5e7eb;padding:8px 12px">Nội dung</td>
      <td style="border:1px solid #e5e7eb;padding:8px 12px">Nội dung</td>
    </tr>
  </tbody>
</table><p><br></p>`
    exec('insertHTML', table)
  }

  const insertDivider = () => {
    exec('insertHTML', '<hr style="border:none;border-top:2px solid #e5e7eb;margin:16px 0"><p><br></p>')
  }

  const insertCallout = (type: 'info' | 'warning' | 'success') => {
    const colors = {
      info: { bg: '#eff6ff', border: '#3b82f6', icon: 'ℹ️' },
      warning: { bg: '#fffbeb', border: '#f59e0b', icon: '⚠️' },
      success: { bg: '#f0fdf4', border: '#22c55e', icon: '✅' },
    }
    const c = colors[type]
    exec('insertHTML', `<div style="background:${c.bg};border-left:4px solid ${c.border};border-radius:6px;padding:12px 16px;margin:8px 0">${c.icon} Nhập nội dung...</div><p><br></p>`)
  }

  return (
    <div className="border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
        {/* Text style */}
        <Btn onClick={() => exec('bold')} title="Đậm (Ctrl+B)" active={isActive('bold')}>
          <strong>B</strong>
        </Btn>
        <Btn onClick={() => exec('italic')} title="Nghiêng (Ctrl+I)" active={isActive('italic')}>
          <em>I</em>
        </Btn>
        <Btn onClick={() => exec('underline')} title="Gạch chân (Ctrl+U)" active={isActive('underline')}>
          <span className="underline">U</span>
        </Btn>
        <Btn onClick={() => exec('strikeThrough')} title="Gạch ngang">
          <span className="line-through">S</span>
        </Btn>

        <Sep />

        {/* Headings */}
        <Btn onClick={() => exec('formatBlock', '<h2>')} title="Tiêu đề lớn">
          <span className="text-xs font-bold">H2</span>
        </Btn>
        <Btn onClick={() => exec('formatBlock', '<h3>')} title="Tiêu đề nhỏ">
          <span className="text-xs font-bold">H3</span>
        </Btn>
        <Btn onClick={() => exec('formatBlock', '<p>')} title="Đoạn văn">
          <span className="text-xs">¶</span>
        </Btn>

        <Sep />

        {/* Lists */}
        <Btn onClick={() => exec('insertUnorderedList')} title="Danh sách chấm">
          <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current">
            <circle cx="2" cy="5" r="1.5"/><rect x="5" y="4" width="10" height="2" rx="1"/>
            <circle cx="2" cy="11" r="1.5"/><rect x="5" y="10" width="10" height="2" rx="1"/>
          </svg>
        </Btn>
        <Btn onClick={() => exec('insertOrderedList')} title="Danh sách số">
          <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current">
            <text x="0" y="7" fontSize="7" fontWeight="bold">1.</text>
            <rect x="6" y="4" width="9" height="2" rx="1"/>
            <text x="0" y="14" fontSize="7" fontWeight="bold">2.</text>
            <rect x="6" y="11" width="9" height="2" rx="1"/>
          </svg>
        </Btn>
        <Btn onClick={() => exec('indent')} title="Thụt vào">
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 4l4 4-4 4M8 4h6M8 8h4M8 12h5"/>
          </svg>
        </Btn>
        <Btn onClick={() => exec('outdent')} title="Thụt ra">
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 4l-4 4 4 4M4 8h10"/>
          </svg>
        </Btn>

        <Sep />

        {/* Alignment */}
        <Btn onClick={() => exec('justifyLeft')} title="Căn trái">
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="2" y1="4" x2="14" y2="4"/><line x1="2" y1="8" x2="10" y2="8"/><line x1="2" y1="12" x2="12" y2="12"/>
          </svg>
        </Btn>
        <Btn onClick={() => exec('justifyCenter')} title="Căn giữa">
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="2" y1="4" x2="14" y2="4"/><line x1="4" y1="8" x2="12" y2="8"/><line x1="3" y1="12" x2="13" y2="12"/>
          </svg>
        </Btn>

        <Sep />

        {/* Insert */}
        <Btn onClick={insertLink} title="Chèn liên kết">
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6.5 9.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5l-1 1"/>
            <path d="M9.5 6.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5l1-1"/>
          </svg>
        </Btn>

        <Btn onClick={() => fileRef.current?.click()} title="Chèn ảnh">
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="3" width="14" height="10" rx="1"/>
            <circle cx="5.5" cy="6.5" r="1.5"/>
            <path d="M1 11l4-3 3 3 2-2 5 4"/>
          </svg>
        </Btn>

        <Btn onClick={insertTable} title="Chèn bảng">
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="2" width="14" height="12" rx="1"/>
            <line x1="1" y1="6" x2="15" y2="6"/>
            <line x1="1" y1="10" x2="15" y2="10"/>
            <line x1="6" y1="2" x2="6" y2="14"/>
            <line x1="10" y1="2" x2="10" y2="14"/>
          </svg>
        </Btn>

        <Btn onClick={insertDivider} title="Đường kẻ ngang">
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="2" y1="8" x2="14" y2="8"/>
            <line x1="4" y1="4" x2="4" y2="6"/><line x1="12" y1="4" x2="12" y2="6"/>
            <line x1="4" y1="10" x2="4" y2="12"/><line x1="12" y1="10" x2="12" y2="12"/>
          </svg>
        </Btn>

        <Sep />

        {/* Callout boxes */}
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); insertCallout('info') }}
          title="Khung thông tin (xanh)"
          className="px-2 h-8 rounded text-xs text-blue-600 hover:bg-blue-50 border border-blue-200"
        >ℹ️</button>
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); insertCallout('warning') }}
          title="Khung cảnh báo (vàng)"
          className="px-2 h-8 rounded text-xs text-amber-600 hover:bg-amber-50 border border-amber-200"
        >⚠️</button>
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); insertCallout('success') }}
          title="Khung thành công (xanh lá)"
          className="px-2 h-8 rounded text-xs text-green-600 hover:bg-green-50 border border-green-200"
        >✅</button>

        <Sep />

        {/* Color */}
        <label title="Màu chữ" className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded">
          <span className="text-sm font-bold text-red-500">A</span>
          <input type="color" className="sr-only" onChange={e => exec('foreColor', e.target.value)} />
        </label>
        <label title="Màu nền chữ" className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded">
          <span className="text-sm font-bold" style={{ background: 'linear-gradient(to right,#fef08a,#86efac)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>A</span>
          <input type="color" className="sr-only" onChange={e => exec('hiliteColor', e.target.value)} />
        </label>

        <Sep />

        {/* Undo / Redo */}
        <Btn onClick={() => exec('undo')} title="Hoàn tác (Ctrl+Z)">
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 4L2 6l2 2M2 6h8a4 4 0 010 8H6"/>
          </svg>
        </Btn>
        <Btn onClick={() => exec('redo')} title="Làm lại (Ctrl+Y)">
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 4l2 2-2 2M14 6H6a4 4 0 000 8h4"/>
          </svg>
        </Btn>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={async e => {
          const file = e.target.files?.[0]
          if (file) {
            await handleImageFile(file)
            e.target.value = ''
          }
        }}
      />

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onCompositionStart={() => { isComposing.current = true }}
        onCompositionEnd={() => { isComposing.current = false; emitChange() }}
        data-placeholder={placeholder}
        style={{ minHeight }}
        className={`
          px-4 py-3 outline-none text-sm text-gray-800
          [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-gray-900
          [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:text-gray-800
          [&_p]:my-1 [&_p:empty]:min-h-[1.5em]
          [&_ul]:pl-5 [&_ul]:list-disc [&_ul]:my-1
          [&_ol]:pl-5 [&_ol]:list-decimal [&_ol]:my-1
          [&_li]:my-0.5
          [&_a]:text-blue-600 [&_a]:underline [&_a:hover]:text-blue-800
          [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2 [&_img]:shadow-sm
          [&_img]:cursor-pointer [&_img:hover]:outline [&_img:hover]:outline-2 [&_img:hover]:outline-blue-400
          [&_hr]:my-4 [&_hr]:border-gray-200
          [&_table]:w-full [&_table]:border-collapse [&_table]:my-2
          [&_th]:border [&_th]:border-gray-200 [&_th]:px-3 [&_th]:py-2 [&_th]:bg-gray-50 [&_th]:text-left [&_th]:font-semibold
          [&_td]:border [&_td]:border-gray-200 [&_td]:px-3 [&_td]:py-2
          [&_blockquote]:border-l-4 [&_blockquote]:border-blue-400 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:my-2
          empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none
        `}
      />

      {/* Footer hint */}
      <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50 text-[10px] text-gray-400 flex gap-3">
        <span>Kéo thả ảnh vào editor</span>
        <span>·</span>
        <span>Ctrl+V để dán ảnh từ clipboard</span>
        <span>·</span>
        <span>Ctrl+B/I/U để định dạng nhanh</span>
      </div>
    </div>
  )
}
