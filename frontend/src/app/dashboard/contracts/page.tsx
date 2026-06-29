'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, differenceInDays } from 'date-fns'
import {
  getExpiringSoon,
  updateContractStatus,
  CONTRACT_TYPE_LABELS,
  CONTRACT_STATUS_LABELS,
  type Contract, type ContractStatus,
} from '@/lib/contracts'
import { searchEmployees } from '@/lib/personnel'
import { useRoles } from '@/hooks/useRoles'
import { useDebounce } from '@/hooks/useDebounce'
import { Badge } from '@/components/ui/badge'
import { ContractModal } from '@/components/contract-modal'

const STATUS_VARIANT: Record<ContractStatus, 'yellow' | 'green' | 'red'> = {
  DRAFT: 'yellow', ACTIVE: 'green', EXPIRED: 'red', TERMINATED: 'red',
}

export default function ContractsPage() {
  const { isHR } = useRoles()
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Contract | null>(null)
  const [selectedEmp, setSelectedEmp] = useState<{ id: string; name: string; dept?: string; position?: string } | null>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 350)
  const [tab, setTab] = useState<'expiring' | 'all'>('expiring')

  const { data: expiring = [], isLoading: loadingExp } = useQuery({
    queryKey: ['contracts-expiring'],
    queryFn: () => getExpiringSoon(60),
    enabled: tab === 'expiring',
  })

  const { data: empData } = useQuery({
    queryKey: ['employees-search', debouncedSearch],
    queryFn: () => searchEmployees({ keyword: debouncedSearch, page: 0, size: 20, status: 'ACTIVE' }),
    enabled: debouncedSearch.length >= 1,
    staleTime: 5000,
  })

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateContractStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts-expiring'] }),
  })

  if (!isHR) return (
    <div className="py-20 text-center text-gray-400 text-sm">Bạn không có quyền truy cập trang này.</div>
  )

  const rows = tab === 'expiring' ? expiring : []
  const isLoading = tab === 'expiring' ? loadingExp : false

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hợp đồng lao động</h1>
          <p className="text-sm text-gray-500 mt-0.5">Quản lý và theo dõi hợp đồng toàn bệnh viện</p>
        </div>
        <button
          onClick={() => { setEditing(null); setSelectedEmp(null); setShowModal(true) }}
          className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          + Tạo hợp đồng
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <button onClick={() => setTab('expiring')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'expiring' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          Sắp hết hạn
          {expiring.length > 0 && (
            <span className="ml-2 bg-amber-100 text-amber-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
              {expiring.length}
            </span>
          )}
        </button>
        <button onClick={() => setTab('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          Tìm theo nhân viên
        </button>
      </div>

      {tab === 'expiring' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Nhân viên</th>
                <th className="px-4 py-3 text-left">Số HĐ</th>
                <th className="px-4 py-3 text-left">Loại</th>
                <th className="px-4 py-3 text-left">Hết hạn</th>
                <th className="px-4 py-3 text-left">Còn</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Đang tải...</td></tr>
              )}
              {!isLoading && rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                  Không có hợp đồng nào hết hạn trong 60 ngày tới.
                </td></tr>
              )}
              {rows.map(c => {
                const daysLeft = c.endDate ? differenceInDays(new Date(c.endDate), new Date()) : null
                const urgent = daysLeft !== null && daysLeft <= 14
                return (
                  <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${urgent ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{c.employeeName}</p>
                      <p className="text-xs text-gray-400">{c.employeeCode}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-blue-600">{c.contractNumber}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{CONTRACT_TYPE_LABELS[c.contractType] ?? c.contractType}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {c.endDate ? format(new Date(c.endDate), 'dd/MM/yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {daysLeft !== null && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          daysLeft <= 14 ? 'bg-red-100 text-red-700' :
                          daysLeft <= 30 ? 'bg-amber-100 text-amber-700' :
                                           'bg-blue-50 text-blue-600'
                        }`}>
                          {daysLeft} ngày
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={CONTRACT_STATUS_LABELS[c.status]} variant={STATUS_VARIANT[c.status]} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditing(c); setSelectedEmp({ id: c.employeeId, name: c.employeeName }); setShowModal(true) }}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Sửa
                        </button>
                        {c.status === 'ACTIVE' && (
                          <button
                            onClick={() => statusMut.mutate({ id: c.id, status: 'TERMINATED' })}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Thanh lý
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'all' && (
        <div className="space-y-4">
          <div className="relative">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm nhân viên theo tên hoặc mã..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
            />
            <svg className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          {empData?.content?.map(emp => (
            <div key={emp.id}
              onClick={() => { setSelectedEmp({ id: emp.id, name: emp.fullName, dept: emp.department?.name, position: emp.position ?? undefined }); setEditing(null); setShowModal(true) }}
              className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center gap-4 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                {emp.fullName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-800">{emp.fullName}</p>
                <p className="text-xs text-gray-400">{emp.employeeCode} · {emp.department?.name ?? '—'} · {emp.position ?? '—'}</p>
              </div>
              <span className="text-xs text-blue-600 font-medium flex-shrink-0">+ Tạo hợp đồng →</span>
            </div>
          ))}
        </div>
      )}

      {showModal && selectedEmp && (
        <ContractModal
          open={showModal}
          onClose={() => { setShowModal(false); setEditing(null); setSelectedEmp(null) }}
          employeeId={selectedEmp.id}
          employeeName={selectedEmp.name}
          departmentName={selectedEmp.dept}
          position={selectedEmp.position}
          editing={editing}
        />
      )}

      {showModal && !selectedEmp && !editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Chọn nhân viên</h2>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc mã..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="max-h-60 overflow-y-auto space-y-2">
              {empData?.content?.map(emp => (
                <button key={emp.id} type="button"
                  onClick={() => setSelectedEmp({ id: emp.id, name: emp.fullName, dept: emp.department?.name, position: emp.position ?? undefined })}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-blue-50 transition-colors">
                  <p className="text-sm font-medium text-gray-800">{emp.fullName}</p>
                  <p className="text-xs text-gray-400">{emp.employeeCode} · {emp.department?.name ?? '—'}</p>
                </button>
              ))}
            </div>
            <button onClick={() => setShowModal(false)} className="w-full text-sm text-gray-500 hover:text-gray-700 pt-1">Hủy</button>
          </div>
        </div>
      )}
    </div>
  )
}
