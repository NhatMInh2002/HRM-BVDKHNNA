'use client'
import { useState } from 'react'
import type { Department } from '@/lib/departments'

interface DeptTreeProps {
  departments: Department[]
}

function DeptCard({ dept }: { dept: Department }) {
  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white hover:border-blue-400 hover:shadow-md transition-all cursor-default min-w-[140px]">
      <p className="text-sm font-semibold text-gray-800 leading-tight mb-2">{dept.name}</p>
      <span className="inline-block text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5">
        {dept.code}
      </span>
      <p className="text-xs text-gray-400 mt-1.5">Nhân viên: —</p>
    </div>
  )
}

function GroupSection({ group }: { group: Department }) {
  const [expanded, setExpanded] = useState(true)
  const children = group.children ?? []

  return (
    <div className="border border-blue-200 rounded-xl overflow-hidden shadow-sm">
      {/* Group header */}
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-blue-900 text-white hover:bg-blue-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-300 flex-shrink-0" />
          <span className="font-semibold text-sm tracking-wide">{group.name}</span>
          <span className="text-xs bg-blue-700 text-blue-200 rounded-full px-2 py-0.5">
            {children.length}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-blue-300 transition-transform duration-200 ${expanded ? 'rotate-0' : '-rotate-90'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Children grid */}
      {expanded && (
        <div className="p-4 bg-gray-50">
          {children.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Chưa có phòng ban con</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {children.map(child => (
                <DeptCard key={child.id} dept={child} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function DeptTree({ departments }: DeptTreeProps) {
  if (departments.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <svg className="mx-auto w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <p className="text-sm">Không tìm thấy phòng ban nào</p>
      </div>
    )
  }

  // Root groups (code starts with GRP-) render as collapsible sections
  const groups = departments.filter(d => d.code.startsWith('GRP-'))
  // Standalone departments that are neither groups nor children of a group
  const standalone = departments.filter(d => !d.code.startsWith('GRP-') && !d.parentId)

  return (
    <div className="space-y-4">
      {groups.map(group => (
        <GroupSection key={group.id} group={group} />
      ))}
      {standalone.length > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 bg-gray-700 text-white flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-300 flex-shrink-0" />
            <span className="font-semibold text-sm tracking-wide">Phòng ban khác</span>
            <span className="text-xs bg-gray-600 text-gray-300 rounded-full px-2 py-0.5">
              {standalone.length}
            </span>
          </div>
          <div className="p-4 bg-gray-50">
            <div className="flex flex-wrap gap-3">
              {standalone.map(dept => (
                <DeptCard key={dept.id} dept={dept} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
