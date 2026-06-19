'use client'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDepartmentTree } from '@/lib/departments'
import type { Department } from '@/lib/departments'
import { DeptTree } from '@/components/org-chart/dept-tree'

function countAll(depts: Department[]): number {
  return depts.reduce((acc, d) => acc + 1 + countAll(d.children ?? []), 0)
}

function filterTree(depts: Department[], q: string): Department[] {
  if (!q) return depts
  const lower = q.toLowerCase()
  return depts
    .map(d => {
      const matchSelf = d.name.toLowerCase().includes(lower) || d.code.toLowerCase().includes(lower)
      const filteredChildren = filterTree(d.children ?? [], q)
      if (matchSelf) return { ...d }
      if (filteredChildren.length > 0) return { ...d, children: filteredChildren }
      return null
    })
    .filter(Boolean) as Department[]
}

export default function OrgChartPage() {
  const [search, setSearch] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dept-tree'],
    queryFn: getDepartmentTree,
  })

  const filtered = useMemo(() => filterTree(data ?? [], search), [data, search])
  const total = useMemo(() => countAll(data ?? []), [data])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Sơ đồ tổ chức</h1>
          {!isLoading && !isError && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {total} phòng ban
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm phòng ban..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="overflow-x-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <svg className="animate-spin w-6 h-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm">Đang tải...</span>
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <svg className="mx-auto w-10 h-10 text-red-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p className="text-sm text-gray-500">Không thể tải dữ liệu phòng ban.</p>
              <p className="text-xs text-gray-400 mt-1">Vui lòng kiểm tra kết nối backend.</p>
            </div>
          </div>
        )}

        {!isLoading && !isError && (
          <DeptTree departments={filtered} />
        )}
      </div>
    </div>
  )
}
