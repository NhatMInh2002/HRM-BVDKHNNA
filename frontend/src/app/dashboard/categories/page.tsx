'use client'
import { useState, useEffect } from 'react'
import {
  CategoryKey, CategoryItem, CATEGORY_META,
  getCategory, saveCategory, resetCategory,
} from '@/lib/categories'

const TABS: CategoryKey[] = [
  'trinh_do', 'chuc_vu', 'dan_toc', 'ton_giao',
  'loai_hop_dong', 'quan_huyen', 'phuong_xa',
]

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState<CategoryKey>('trinh_do')
  const [items, setItems]         = useState<CategoryItem[]>([])
  const [newLabel, setNewLabel]   = useState('')
  const [editId, setEditId]       = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [saved, setSaved]         = useState(false)

  useEffect(() => {
    setItems(getCategory(activeTab))
    setNewLabel('')
    setEditId(null)
  }, [activeTab])

  const persist = (next: CategoryItem[]) => {
    setItems(next)
    saveCategory(activeTab, next)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const addItem = () => {
    const label = newLabel.trim()
    if (!label) return
    const id = `${activeTab}_${Date.now()}`
    persist([...items, { id, label, order: items.length, active: true }])
    setNewLabel('')
  }

  const toggleActive = (id: string) =>
    persist(items.map(i => i.id === id ? { ...i, active: !i.active } : i))

  const saveEdit = (id: string) => {
    const label = editLabel.trim()
    if (!label) return
    persist(items.map(i => i.id === id ? { ...i, label } : i))
    setEditId(null)
  }

  const deleteItem = (id: string) =>
    persist(items.filter(i => i.id !== id))

  const moveUp = (idx: number) => {
    if (idx === 0) return
    const next = [...items]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    persist(next.map((it, i) => ({ ...it, order: i })))
  }

  const moveDown = (idx: number) => {
    if (idx === items.length - 1) return
    const next = [...items]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    persist(next.map((it, i) => ({ ...it, order: i })))
  }

  const handleReset = () => {
    if (!confirm(`Reset "${CATEGORY_META[activeTab].title}" về mặc định? Mọi thay đổi sẽ mất.`)) return
    resetCategory(activeTab)
    setItems(getCategory(activeTab))
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const meta = CATEGORY_META[activeTab]
  const active = items.filter(i => i.active)
  const inactive = items.filter(i => !i.active)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý danh mục</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Cấu hình các giá trị xuất hiện trong select box trên toàn hệ thống
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs text-green-600 font-medium bg-green-50 border border-green-200
                             px-3 py-1.5 rounded-full">✓ Đã lưu</span>
          )}
          <button onClick={handleReset}
            className="text-xs text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-300
                       px-3 py-1.5 rounded-full transition-colors">
            ↺ Reset mặc định
          </button>
        </div>
      </div>

      {/* Tabs — horizontal scroll on small screens, sidebar on large */}
      <div className="flex flex-col lg:flex-row gap-4">
        <aside className="lg:w-44 lg:flex-shrink-0">
          {/* Mobile: scrollable pill tabs */}
          <div className="flex lg:hidden gap-2 overflow-x-auto pb-1 scrollbar-none">
            {TABS.map(key => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {CATEGORY_META[key].title}
              </button>
            ))}
          </div>
          {/* Desktop: vertical list */}
          <ul className="hidden lg:block space-y-0.5">
            {TABS.map(key => (
              <li key={key}>
                <button
                  onClick={() => setActiveTab(key)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === key ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="block">{CATEGORY_META[key].title}</span>
                  {activeTab === key && (
                    <span className="text-blue-200 text-xs font-normal">{active.length} mục</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden min-w-0">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-800">DM {meta.title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{meta.description}</p>
          </div>

          {/* Add row */}
          <div className="px-5 py-3 border-b border-gray-100 flex gap-2">
            <input
              type="text"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem()}
              placeholder={`Thêm ${meta.title.toLowerCase()} mới…`}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={addItem}
              disabled={!newLabel.trim()}
              className="bg-blue-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg
                         hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              + Thêm
            </button>
          </div>

          {/* Active items */}
          {active.length > 0 && (
            <ul className="divide-y divide-gray-100">
              {items
                .map((item, idx) => ({ item, idx }))
                .filter(({ item }) => item.active)
                .map(({ item, idx }) => (
                  <li key={item.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 group">
                    {/* Order buttons */}
                    <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => moveUp(idx)}
                        className="text-gray-400 hover:text-gray-600 leading-none text-xs">▲</button>
                      <button onClick={() => moveDown(idx)}
                        className="text-gray-400 hover:text-gray-600 leading-none text-xs">▼</button>
                    </div>

                    <span className="w-6 text-xs text-gray-300 font-mono text-right flex-shrink-0">
                      {idx + 1}
                    </span>

                    {/* Label or edit input */}
                    {editId === item.id ? (
                      <input
                        autoFocus
                        value={editLabel}
                        onChange={e => setEditLabel(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveEdit(item.id)
                          if (e.key === 'Escape') setEditId(null)
                        }}
                        className="flex-1 border border-blue-400 rounded px-2 py-0.5 text-sm
                                   focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    ) : (
                      <span className="flex-1 text-sm text-gray-800">{item.label}</span>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {editId === item.id ? (
                        <>
                          <button onClick={() => saveEdit(item.id)}
                            className="text-xs text-green-600 font-medium hover:underline px-1">Lưu</button>
                          <button onClick={() => setEditId(null)}
                            className="text-xs text-gray-400 hover:underline px-1">Hủy</button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => { setEditId(item.id); setEditLabel(item.label) }}
                            className="text-xs text-blue-500 hover:underline px-1"
                          >Sửa</button>
                          <button onClick={() => toggleActive(item.id)}
                            className="text-xs text-yellow-500 hover:underline px-1">Ẩn</button>
                          <button onClick={() => deleteItem(item.id)}
                            className="text-xs text-red-400 hover:underline px-1">Xóa</button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
            </ul>
          )}

          {active.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400">
              Chưa có mục nào — thêm mục đầu tiên ở trên
            </div>
          )}

          {/* Hidden items */}
          {inactive.length > 0 && (
            <div className="border-t border-gray-100">
              <div className="px-5 py-2 bg-gray-50">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Đã ẩn ({inactive.length})
                </span>
              </div>
              <ul className="divide-y divide-gray-100">
                {inactive.map(item => (
                  <li key={item.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 group">
                    <span className="w-6" />
                    <span className="flex-1 text-sm text-gray-400 line-through">{item.label}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => toggleActive(item.id)}
                        className="text-xs text-green-500 hover:underline px-1">Hiện lại</button>
                      <button onClick={() => deleteItem(item.id)}
                        className="text-xs text-red-400 hover:underline px-1">Xóa hẳn</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

