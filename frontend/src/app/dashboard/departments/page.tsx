'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDepartments, getDepartmentsTree, searchEmployees, type Department } from '@/lib/personnel'


function DeptNode({
  node, level = 0, empCountMap,
}: {
  node: Department
  level?: number
  empCountMap: Map<string, number>
}) {
  const children = node.children ?? []
  const [open, setOpen] = useState(level < 2)
  const isGroup = node.code.startsWith('GRP-')
  const count = empCountMap.get(node.id) ?? 0

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-2 rounded-lg hover:bg-gray-50 select-none
          ${children.length > 0 ? 'cursor-pointer' : 'cursor-default'}
          ${isGroup ? 'text-gray-400' : 'text-gray-800'}`}
        style={{ paddingLeft: `${12 + level * 20}px`, paddingRight: 12 }}
        onClick={() => children.length > 0 && setOpen(o => !o)}
      >
        <span className="w-4 flex-shrink-0 text-gray-400 text-xs text-center">
          {children.length > 0 ? (open ? '▼' : '▶') : ''}
        </span>
        <span className={`text-xs font-mono px-1.5 py-0.5 rounded flex-shrink-0
          ${isGroup ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600'}`}>
          {node.code}
        </span>
        <span className={`text-sm flex-1 ${isGroup ? 'text-gray-400 italic' : 'font-medium'}`}>
          {node.name}
        </span>
        {!isGroup && count > 0 && (
          <span className="text-xs text-gray-400 flex-shrink-0">{count} người</span>
        )}
        {isGroup && (
          <span className="text-xs text-gray-300 flex-shrink-0 italic">nhóm</span>
        )}
      </div>
      {open && children.map(child => (
        <DeptNode key={child.id} node={child} level={level + 1} empCountMap={empCountMap} />
      ))}
    </div>
  )
}

export default function DepartmentsPage() {
  const { data: departments = [], isLoading: deptLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
  })

  const { data: tree = [], isLoading: treeLoading } = useQuery({
    queryKey: ['departments-tree'],
    queryFn: getDepartmentsTree,
  })

  const isLoading = deptLoading || treeLoading

  const { data: empData } = useQuery({
    queryKey: ['employees-all-for-count'],
    queryFn: () => searchEmployees({ status: 'ACTIVE', page: 0, size: 500 }),
    staleTime: 60_000,
  })

  const empCountMap = new Map<string, number>()
  if (empData?.content) {
    for (const emp of empData.content) {
      const did = emp.department?.id
      if (did) empCountMap.set(did, (empCountMap.get(did) ?? 0) + 1)
    }
  }

  const realDepts = departments.filter(d => !d.code.startsWith('GRP-'))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Quản lý phòng ban</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {realDepts.length} phòng ban / khoa / tổ
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Khối phòng ban</p>
          <p className="text-3xl font-bold text-blue-800 mt-1">
            {realDepts.filter(d => d.code.startsWith('P-')).length}
          </p>
          <p className="text-xs text-blue-400 mt-0.5">Phòng hành chính</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Khoa lâm sàng</p>
          <p className="text-3xl font-bold text-green-800 mt-1">
            {realDepts.filter(d => d.code.startsWith('K-')).length}
          </p>
          <p className="text-xs text-green-400 mt-0.5">Khoa điều trị</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Trung tâm & Tổ</p>
          <p className="text-3xl font-bold text-purple-800 mt-1">
            {realDepts.filter(d => d.code.startsWith('TT-') || d.code.startsWith('T-')).length}
          </p>
          <p className="text-xs text-purple-400 mt-0.5">Trung tâm chuyên sâu</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-semibold text-gray-700">Sơ đồ tổ chức</span>
          <span className="text-xs text-gray-400">Màu xám nghiêng = nhóm ảo, không phải đơn vị thực</span>
        </div>
        {isLoading ? (
          <div className="py-12 text-center text-sm text-gray-400">Đang tải...</div>
        ) : (
          <div className="py-2">
            {tree.map(node => (
              <DeptNode key={node.id} node={node} empCountMap={empCountMap} />
            ))}
          </div>
        )}
      </div>

      {/* Danh sách phẳng */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <span className="text-sm font-semibold text-gray-700">Danh sách phòng ban thực tế</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[400px]">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-2 text-left">Mã</th>
                <th className="px-4 py-2 text-left">Tên phòng ban</th>
                <th className="px-4 py-2 text-right">Nhân viên</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {realDepts.sort((a, b) => a.name.localeCompare(b.name, 'vi')).map(d => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-xs text-blue-600 whitespace-nowrap">{d.code}</td>
                  <td className="px-4 py-2 text-gray-800">{d.name}</td>
                  <td className="px-4 py-2 text-right text-gray-500 whitespace-nowrap">
                    {empCountMap.get(d.id) ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
