'use client'
import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getDepartmentsTree, searchEmployees, updateDepartmentContact,
  type Department,
} from '@/lib/personnel'
import { useRoles } from '@/hooks/useRoles'

// ── Một dòng phòng ban trong cây ────────────────────────────────
function DeptRow({
  node, level, onEdit, canEdit,
}: {
  node: Department
  level: number
  onEdit: (d: Department) => void
  canEdit: boolean
}) {
  const children = (node.children ?? []).filter(c => !c.code.startsWith('GRP-'))
  const groups   = (node.children ?? []).filter(c => c.code.startsWith('GRP-'))
  const allChildren = [...groups, ...children]
  const [open, setOpen] = useState(level < 1)
  const isGroup = node.code.startsWith('GRP-')

  return (
    <div>
      <div
        className={`group flex items-center gap-3 py-2 px-3 border-b border-gray-50 hover:bg-blue-50/40
          ${isGroup ? '' : ''}`}
        style={{ paddingLeft: `${12 + level * 18}px` }}
      >
        {/* Toggle */}
        <button
          onClick={() => allChildren.length > 0 && setOpen(o => !o)}
          className={`w-4 flex-shrink-0 text-gray-400 text-xs ${allChildren.length > 0 ? 'cursor-pointer' : 'invisible'}`}
        >
          {open ? '▼' : '▶'}
        </button>

        {/* Tên + mã */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm truncate ${isGroup ? 'text-gray-400 italic font-medium' : 'font-medium text-gray-800'}`}>
              {node.name}
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0
              ${isGroup ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600'}`}>
              {node.code}
            </span>
          </div>
        </div>

        {/* Người đứng đầu + SĐT — chỉ với phòng ban thật */}
        {!isGroup && (
          <>
            <div className="hidden md:block w-48 flex-shrink-0 text-xs">
              {node.managerName ? (
                <>
                  <p className="text-gray-700 font-medium truncate">{node.managerName}</p>
                  {node.managerPhone && <p className="text-gray-400">{node.managerPhone}</p>}
                </>
              ) : <span className="text-gray-300">— chưa có —</span>}
            </div>
            <div className="hidden lg:block w-32 flex-shrink-0 text-xs">
              {node.contactPhone
                ? <a href={`tel:${node.contactPhone}`} className="text-blue-600 hover:underline">{node.contactPhone}</a>
                : <span className="text-gray-300">—</span>}
            </div>
            <div className="hidden lg:block w-32 flex-shrink-0 text-xs">
              {node.dutyPhone
                ? <a href={`tel:${node.dutyPhone}`} className="text-red-600 font-medium hover:underline">{node.dutyPhone}</a>
                : <span className="text-gray-300">—</span>}
            </div>
            {canEdit && (
              <button
                onClick={() => onEdit(node)}
                className="flex-shrink-0 text-xs text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity px-1"
                title="Chỉnh sửa"
              >
                ✎
              </button>
            )}
          </>
        )}
      </div>
      {open && allChildren.map(child => (
        <DeptRow key={child.id} node={child} level={level + 1} onEdit={onEdit} canEdit={canEdit} />
      ))}
    </div>
  )
}

// ── Modal sửa thông tin liên hệ ─────────────────────────────────
function EditModal({ dept, onClose }: { dept: Department; onClose: () => void }) {
  const qc = useQueryClient()
  const [managerId, setManagerId]     = useState(dept.managerId ?? '')
  const [contactPhone, setContactPhone] = useState(dept.contactPhone ?? '')
  const [dutyPhone, setDutyPhone]     = useState(dept.dutyPhone ?? '')
  const [empSearch, setEmpSearch]     = useState('')

  const { data: emps } = useQuery({
    queryKey: ['dept-emp-search', dept.id],
    queryFn: () => searchEmployees({ departmentId: dept.id, status: 'ACTIVE', page: 0, size: 200 }),
  })

  const mut = useMutation({
    mutationFn: () => updateDepartmentContact(dept.id, {
      managerId: managerId || null,
      contactPhone: contactPhone || null,
      dutyPhone: dutyPhone || null,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments-tree'] }); onClose() },
  })

  const empList = (emps?.content ?? []).filter(e =>
    !empSearch || e.fullName.toLowerCase().includes(empSearch.toLowerCase()) ||
    e.employeeCode.toLowerCase().includes(empSearch.toLowerCase()))

  // Đóng bằng phím Esc
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Thông tin liên hệ</h2>
          <p className="text-sm text-gray-500">{dept.name} · {dept.code}</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Người đứng đầu</label>
            <input value={empSearch} onChange={e => setEmpSearch(e.target.value)}
              placeholder="Tìm nhân viên trong phòng..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <select value={managerId} onChange={e => setManagerId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Không chọn —</option>
              {empList.map(e => (
                <option key={e.id} value={e.id}>{e.fullName} ({e.employeeCode})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">SĐT liên hệ (hành chính)</label>
            <input value={contactPhone} onChange={e => setContactPhone(e.target.value)}
              placeholder="VD: 0238 3844 528"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">SĐT trực (24/7)</label>
            <input value={dutyPhone} onChange={e => setDutyPhone(e.target.value)}
              placeholder="VD: 0912 345 678"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Hủy</button>
          <button onClick={() => mut.mutate()} disabled={mut.isPending}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60">
            {mut.isPending ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function DepartmentsPage() {
  const { isHR } = useRoles()
  const [editing, setEditing] = useState<Department | null>(null)
  const [search, setSearch]   = useState('')

  const { data: tree = [], isLoading } = useQuery({
    queryKey: ['departments-tree'],
    queryFn: getDepartmentsTree,
  })

  // Đếm số phòng ban thật + số đang trực (có SĐT trực)
  const stats = useMemo(() => {
    let total = 0, withDuty = 0, withHead = 0
    const walk = (nodes: Department[]) => {
      for (const n of nodes) {
        if (!n.code.startsWith('GRP-')) {
          total++
          if (n.dutyPhone) withDuty++
          if (n.managerName) withHead++
        }
        if (n.children) walk(n.children)
      }
    }
    walk(tree)
    return { total, withDuty, withHead }
  }, [tree])

  // Lọc theo tìm kiếm — giữ nhánh cha nếu con khớp
  const filtered = useMemo(() => {
    if (!search.trim()) return tree
    const kw = search.toLowerCase()
    const filterNode = (n: Department): Department | null => {
      const kids = (n.children ?? []).map(filterNode).filter(Boolean) as Department[]
      const selfMatch = n.name.toLowerCase().includes(kw) || n.code.toLowerCase().includes(kw)
        || (n.managerName?.toLowerCase().includes(kw) ?? false)
      if (selfMatch || kids.length) return { ...n, children: kids }
      return null
    }
    return tree.map(filterNode).filter(Boolean) as Department[]
  }, [tree, search])

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sơ đồ tổ chức</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {stats.total} phòng ban / khoa · {stats.withHead} có người đứng đầu · {stats.withDuty} có SĐT trực
          </p>
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm phòng ban, khoa, người đứng đầu..."
            className="w-64 pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {/* Bảng cây */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {/* Header cột (chỉ md+) */}
        <div className="hidden md:flex items-center gap-3 px-3 py-2.5 bg-gray-50 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
          <span className="w-4"/>
          <span className="flex-1">Phòng ban / Khoa</span>
          <span className="w-48 flex-shrink-0">Người đứng đầu</span>
          <span className="hidden lg:block w-32 flex-shrink-0">SĐT liên hệ</span>
          <span className="hidden lg:block w-32 flex-shrink-0">SĐT trực</span>
          {isHR && <span className="w-5"/>}
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm text-gray-400">Đang tải sơ đồ tổ chức...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">Không tìm thấy phòng ban phù hợp</div>
        ) : (
          filtered.map(node => (
            <DeptRow key={node.id} node={node} level={0} onEdit={setEditing} canEdit={isHR} />
          ))
        )}
      </div>

      {editing && <EditModal dept={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
