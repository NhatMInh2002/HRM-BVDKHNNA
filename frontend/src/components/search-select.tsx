'use client'
import { useState } from 'react'

export interface SearchSelectOption {
  value: string
  label: string
}

/**
 * Combobox tự dựng (không dùng <select> gốc) — danh sách gợi ý render bằng div
 * absolute nên nằm trong luồng trang bình thường, không bị trình duyệt "đổ" ra
 * ngoài modal/viewport như <select> gốc khi danh sách dài (native select popup
 * là lớp UI riêng của trình duyệt, bỏ qua overflow/z-index của trang). Gõ để lọc.
 */
export function SearchSelect({ value, onChange, options, placeholder, resetAfterSelect, className }: {
  value: string
  onChange: (v: string) => void
  options: SearchSelectOption[]
  placeholder: string
  resetAfterSelect?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options

  const selectedLabel = options.find(o => o.value === value)?.label ?? ''

  const select = (v: string) => {
    onChange(v)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="relative">
      <input
        className={className ?? 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400'}
        placeholder={placeholder}
        value={open ? query : (resetAfterSelect ? '' : selectedLabel)}
        onFocus={() => setQuery('')}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onClick={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && (
        <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl
                        max-h-52 overflow-y-auto">
          {!resetAfterSelect && (
            <div onMouseDown={() => select('')}
              className="px-3 py-2 text-sm text-gray-400 hover:bg-gray-50 cursor-pointer">— Tất cả —</div>
          )}
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-400">Không tìm thấy</div>
          )}
          {filtered.map(o => (
            <div key={o.value} onMouseDown={() => select(o.value)}
              className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer">{o.label}</div>
          ))}
        </div>
      )}
    </div>
  )
}
