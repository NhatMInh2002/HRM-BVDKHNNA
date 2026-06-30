'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAuditLog, getEntityTypes, ACTION_LABELS, ACTION_COLORS, type AuditLogEntry } from '@/lib/auditLog'

function JsonPreview({ data }: { data?: Record<string, unknown> }) {
  if (!data) return <span className="text-gray-300">—</span>
  const entries = Object.entries(data)
  if (entries.length === 0) return <span className="text-gray-300">—</span>
  return (
    <div className="space-y-0.5">
      {entries.map(([k, v]) => (
        <p key={k} className="text-xs text-gray-500">
          <span className="font-medium text-gray-600">{k}:</span> {String(v)}
        </p>
      ))}
    </div>
  )
}

export default function AuditLogPage() {
  const [entityType, setEntityType] = useState('')
  const [action, setAction]         = useState('')
  const [expanded, setExpanded]     = useState<number | null>(null)

  const { data: entityTypes = [] } = useQuery({ queryKey: ['audit-entity-types'], queryFn: getEntityTypes })
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-log', entityType, action],
    queryFn: () => getAuditLog({ entityType: entityType || undefined, action: action || undefined, limit: 200 }),
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nhật ký kiểm toán (Audit Log)</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Lịch sử bất biến mọi thao tác trên hệ thống — tuân thủ NĐ 13/2023, TT 12/2022
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select value={entityType} onChange={e => setEntityType(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">Tất cả đối tượng</option>
          {(entityTypes as string[]).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={action} onChange={e => setAction(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">Tất cả hành động</option>
          {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <span className="text-xs text-gray-400 ml-auto">{logs.length} bản ghi (tối đa 200 gần nhất)</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">Đang tải...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-4xl mb-3">🔒</p>
            <p className="font-medium">Chưa có bản ghi nào</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Thời gian</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Người thực hiện</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Hành động</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Đối tượng</th>
                <th className="px-4 py-3"/>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(logs as AuditLogEntry[]).map(log => (
                <>
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{log.actor_name ?? 'Hệ thống'}</p>
                      {log.actor_role && <p className="text-xs text-gray-400">{log.actor_role}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-800">{log.entity_type}</p>
                      {log.entity_id && <p className="text-xs text-gray-400 truncate max-w-[200px]">{log.entity_id}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {expanded === log.id ? '▲ Thu gọn' : '▼ Chi tiết'}
                    </td>
                  </tr>
                  {expanded === log.id && (
                    <tr className="bg-gray-50/70">
                      <td colSpan={5} className="px-5 py-4">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Trước thay đổi</p>
                            <JsonPreview data={log.before_data} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Sau thay đổi</p>
                            <JsonPreview data={log.after_data} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
