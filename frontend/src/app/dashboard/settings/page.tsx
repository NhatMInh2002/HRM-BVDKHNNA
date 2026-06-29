'use client'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRoles } from '@/hooks/useRoles'
import {
  getPermissionDefinitions,
  getEmployeesWithPermissions,
  setEmployeePermissions,
  type DeptWithEmployees,
  type EmployeeSummary,
} from '@/lib/permissions'

// ── Icons ──────────────────────────────────────────────────────────────
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`}
      fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
    </svg>
  )
}

function SaveIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M5 13l4 4L19 7"/>
    </svg>
  )
}

// ── Dept Tree ──────────────────────────────────────────────────────────
function DeptTree({
  depts,
  selectedId,
  onSelect,
  onDeptSelect,
}: {
  depts: DeptWithEmployees[]
  selectedId: string | null
  onSelect: (emp: EmployeeSummary) => void
  onDeptSelect: (dept: DeptWithEmployees) => void
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState('')

  const filtered = depts.filter(d =>
    d.departmentName != null &&
    d.departmentName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full text-sm select-none">
      {/* Root node */}
      <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 mb-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
          </svg>
          BVHNĐK Nghệ An
        </div>
        {/* Search box */}
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Tìm khoa/phòng..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.map(dept => {
          const key = dept.departmentName ?? '__null__'
          const isOpen = !!open[key]
          return (
            <div key={key} className="border-b border-gray-50">
              {/* Phòng ban header */}
              <div className="flex items-center hover:bg-gray-50 group">
                {/* Checkbox chọn cả phòng */}
                <label
                  className="flex items-center pl-3 py-2.5 cursor-pointer"
                  onClick={e => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 rounded text-blue-600 border-gray-300 cursor-pointer"
                    onChange={() => onDeptSelect(dept)}
                  />
                </label>
                {/* Tên phòng — click để mở rộng */}
                <button
                  onClick={() => setOpen(p => ({ ...p, [key]: !p[key] }))}
                  className="flex-1 flex items-center gap-2 px-2 py-2.5 text-left"
                >
                  <ChevronIcon open={isOpen} />
                  <span className="font-medium text-gray-700 text-xs leading-tight">
                    {dept.departmentName ?? 'Chưa phân khoa/phòng'}
                  </span>
                  <span className="ml-auto text-[10px] text-gray-400 flex-shrink-0">{dept.employees.length}</span>
                </button>
              </div>

              {/* Nhân viên trong phòng */}
              {isOpen && dept.employees.map(emp => (
                <button
                  key={emp.id}
                  onClick={() => onSelect(emp)}
                  className={`w-full flex items-center gap-2 pl-10 pr-3 py-2 text-left hover:bg-blue-50 transition-colors border-t border-gray-50 ${
                    selectedId === emp.id ? 'bg-blue-50 border-r-2 border-r-blue-500' : ''
                  }`}
                >
                  <PersonIcon />
                  <div className="min-w-0">
                    <p className={`text-xs truncate ${selectedId === emp.id ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                      {emp.fullName}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">{emp.code}</p>
                  </div>
                  {emp.permissions.length > 0 && (
                    <span className="ml-auto flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500" title={`${emp.permissions.length} quyền`} />
                  )}
                </button>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { isAdmin } = useRoles()
  const qc = useQueryClient()

  const [selected, setSelected] = useState<EmployeeSummary | null>(null)
  const [checkedPerms, setCheckedPerms] = useState<Set<string>>(new Set())
  const [dirty, setDirty] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const { data: depts = [], isLoading: loadingDepts, error: deptsError } = useQuery({
    queryKey: ['permission-employees'],
    queryFn: getEmployeesWithPermissions,
    // không filter isAdmin để tránh query không chạy khi session chưa load
    retry: 1,
  })

  const { data: permDefs = [] } = useQuery({
    queryKey: ['permission-defs'],
    queryFn: getPermissionDefinitions,
    enabled: isAdmin,
  })

  const saveMut = useMutation({
    mutationFn: ({ id, perms }: { id: string; perms: string[] }) =>
      setEmployeePermissions(id, perms),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['permission-employees'] })
      setDirty(false)
      setToast({ msg: 'Đã lưu phân quyền', ok: true })
      setTimeout(() => setToast(null), 3000)
    },
    onError: () => {
      setToast({ msg: 'Lỗi khi lưu', ok: false })
      setTimeout(() => setToast(null), 3000)
    },
  })

  function handleSelect(emp: EmployeeSummary) {
    setSelected(emp)
    setCheckedPerms(new Set(emp.permissions))
    setDirty(false)
  }

  function togglePerm(code: string) {
    setCheckedPerms(prev => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
    setDirty(true)
  }

  function handleSave() {
    if (!selected) return
    saveMut.mutate({ id: selected.id, perms: Array.from(checkedPerms) })
  }

  if (!isAdmin) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center text-sm text-red-700 max-w-lg mx-auto mt-8">
        <p className="font-semibold">Không có quyền truy cập</p>
        <p className="mt-1">Trang này chỉ dành cho quản trị viên hệ thống.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Phân quyền</h1>
        <p className="text-sm text-gray-500 mt-0.5">Chọn nhân viên bên trái, tích quyền bên phải</p>
      </div>

      <div className="flex gap-4 h-[calc(100vh-180px)]">

        {/* ── Tree bên trái ──────────────────────────────────── */}
        <div className="w-96 flex-shrink-0 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Khoa / Phòng</p>
          </div>
          <div className="flex-1 overflow-hidden flex flex-col">
            {loadingDepts ? (
              <div className="p-4 text-center text-xs text-gray-400">Đang tải...</div>
            ) : deptsError ? (
              <div className="p-4 text-xs text-red-500">
                Lỗi: {(deptsError as Error).message}
              </div>
            ) : depts.length === 0 ? (
              <div className="p-4 text-xs text-gray-400">Không có dữ liệu</div>
            ) : (
              <DeptTree
                depts={depts}
                selectedId={selected?.id ?? null}
                onSelect={handleSelect}
                onDeptSelect={(dept) => {
                  // Chọn nhân viên đầu tiên của phòng để load quyền, đồng thời highlight
                  if (dept.employees.length > 0) handleSelect(dept.employees[0])
                }}
              />
            )}
          </div>
        </div>

        {/* ── Panel quyền bên phải ───────────────────────────── */}
        <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
              <svg className="w-12 h-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              <p className="text-sm">Chọn một nhân viên để phân quyền</p>
            </div>
          ) : (
            <>
              {/* Header nhân viên được chọn */}
              <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{selected.fullName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {selected.code} · {selected.departmentName ?? 'Chưa phân phòng'}
                    {selected.position && ` · ${selected.position}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {dirty && (
                    <span className="text-xs text-amber-600 font-medium">● Chưa lưu</span>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={!dirty || saveMut.isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
                      bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <SaveIcon />
                    {saveMut.isPending ? 'Đang lưu...' : 'Lưu quyền'}
                  </button>
                </div>
              </div>

              {/* Danh sách nhóm quyền */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {permDefs.map(group => (
                  <div key={group.group}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      {group.group}
                    </p>
                    <div className="space-y-1">
                      {group.items.map(item => {
                        const checked = checkedPerms.has(item.code)
                        return (
                          <label
                            key={item.code}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors
                              ${checked ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePerm(item.code)}
                              className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className={`text-sm ${checked ? 'text-blue-800 font-medium' : 'text-gray-700'}`}>
                              {item.label}
                            </span>
                            <span className="ml-auto text-[10px] text-gray-300 font-mono">{item.code}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer — tóm tắt */}
              <div className="px-5 py-2.5 border-t border-gray-100 bg-gray-50 flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  Đã chọn <strong className="text-blue-600">{checkedPerms.size}</strong> / {permDefs.reduce((s, g) => s + g.items.length, 0)} quyền
                </span>
                {checkedPerms.size > 0 && (
                  <button
                    onClick={() => { setCheckedPerms(new Set()); setDirty(true) }}
                    className="ml-auto text-xs text-red-500 hover:text-red-700"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white
          ${toast.ok ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {toast.ok
            ? <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
            : <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
          }
          {toast.msg}
        </div>
      )}
    </div>
  )
}
