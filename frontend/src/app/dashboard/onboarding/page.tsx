'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getTemplates, getChecklists, getChecklist, createChecklist, updateTaskStatus,
  getOnboardingStats, createTemplate, CATEGORY_LABELS, CATEGORY_COLORS,
  type OnboardingChecklist, type OnboardingTask, type TemplateTaskInput,
} from '@/lib/onboarding'
import { getDepartments } from '@/lib/departments'
import { searchEmployees, type Employee } from '@/lib/personnel'
import { ResizableModal } from '@/components/resizable-modal'

// ── Stats card ──────────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

// ── Checklist detail modal ──────────────────────────────────────
function ChecklistModal({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['checklist', id], queryFn: () => getChecklist(id) })

  const toggle = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      updateTaskStatus(taskId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklist', id] }),
  })

  if (isLoading || !data) return (
    <ResizableModal onClose={onClose} defaultWidth={700} defaultHeight={600}>
      <div className="flex items-center justify-center h-full text-gray-400">Đang tải...</div>
    </ResizableModal>
  )

  const tasks = (data.tasks ?? []) as OnboardingTask[]
  const done  = tasks.filter(t => t.status === 'DONE').length
  const pct   = tasks.length ? Math.round((done / tasks.length) * 100) : 0

  const grouped = CATEGORY_LABELS
  const byCategory: Record<string, OnboardingTask[]> = {}
  tasks.forEach(t => {
    if (!byCategory[t.category]) byCategory[t.category] = []
    byCategory[t.category].push(t)
  })

  return (
    <ResizableModal onClose={onClose} defaultWidth={700} defaultHeight={620}>
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Onboarding — {data.full_name}
            </h2>
            <p className="text-sm text-gray-500">{data.employee_code} · {data.department_name}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">{pct}%</p>
              <p className="text-xs text-gray-400">{done}/{tasks.length} việc</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex-shrink-0 px-6 py-2">
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {Object.entries(byCategory).map(([cat, catTasks]) => (
            <div key={cat}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {CATEGORY_LABELS[cat] ?? cat}
              </p>
              <div className="space-y-2">
                {catTasks.map(task => (
                  <div key={task.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                      task.status === 'DONE'
                        ? 'bg-green-50 border-green-100'
                        : 'bg-white border-gray-100 hover:border-gray-200'
                    }`}>
                    <button
                      onClick={() => toggle.mutate({ taskId: task.id, status: task.status === 'DONE' ? 'PENDING' : 'DONE' })}
                      className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors ${
                        task.status === 'DONE'
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-400'
                      }`}>
                      {task.status === 'DONE' && (
                        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${task.status === 'DONE' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                        {task.title}
                        {task.is_required && <span className="text-red-400 ml-1">*</span>}
                      </p>
                      {task.description && <p className="text-xs text-gray-400 mt-0.5">{task.description}</p>}
                      {task.due_date && (
                        <p className={`text-xs mt-0.5 ${
                          task.status !== 'DONE' && task.due_date < new Date().toISOString().slice(0,10)
                            ? 'text-red-500' : 'text-gray-400'
                        }`}>
                          Hạn: {new Date(task.due_date).toLocaleDateString('vi-VN')}
                        </p>
                      )}
                    </div>
                    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[task.category] ?? 'bg-gray-100 text-gray-600'}`}>
                      {task.status === 'DONE' ? 'Hoàn thành' : task.status === 'IN_PROGRESS' ? 'Đang làm' : 'Chờ'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ResizableModal>
  )
}

// ── New checklist modal ─────────────────────────────────────────
function NewChecklistModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const { data: templates = [] } = useQuery({ queryKey: ['ob-templates'], queryFn: getTemplates })
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null)
  const [empSearch, setEmpSearch]     = useState('')
  const [showList, setShowList]       = useState(false)
  const [templateId, setTemplateId]   = useState('')
  const [startDate, setStartDate]     = useState(new Date().toISOString().slice(0,10))

  const { data: empResults } = useQuery({
    queryKey: ['ob-employee-search', empSearch],
    queryFn: () => searchEmployees({ keyword: empSearch, page: 0, size: 20 }),
    enabled: empSearch.length >= 2,
  })

  const mut = useMutation({
    mutationFn: () => createChecklist({ employeeId: selectedEmp!.id, templateId, startDate }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['checklists'] }); onClose() },
  })

  return (
    <ResizableModal onClose={onClose} defaultWidth={500} defaultHeight={400}>
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Tạo checklist onboarding</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nhân viên *</label>
            {selectedEmp ? (
              <div className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 bg-blue-50">
                <div className="min-w-0">
                  <span className="text-sm font-medium text-gray-800">{selectedEmp.fullName}</span>
                  <span className="text-blue-500 ml-2 text-xs font-mono">{selectedEmp.employeeCode}</span>
                </div>
                <button onClick={() => setSelectedEmp(null)}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 text-lg leading-none ml-2">×</button>
              </div>
            ) : (
              <div className="relative">
                <input value={empSearch}
                  onChange={e => { setEmpSearch(e.target.value); setShowList(true) }}
                  onFocus={() => setShowList(true)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tìm theo tên hoặc mã nhân viên (ít nhất 2 ký tự)…" />
                {showList && empResults?.content?.length ? (
                  <div className="absolute z-20 w-full mt-1 border border-gray-200 rounded-xl shadow-xl bg-white
                                  max-h-52 overflow-y-auto">
                    {empResults.content.map(emp => (
                      <div key={emp.id}
                        onClick={() => { setSelectedEmp(emp); setEmpSearch(''); setShowList(false) }}
                        className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0">
                        <span className="text-sm font-medium text-gray-800">{emp.fullName}</span>
                        <span className="text-blue-500 ml-2 text-xs font-mono">{emp.employeeCode}</span>
                        {emp.position && <span className="text-gray-400 ml-2 text-xs">· {emp.position}</span>}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mẫu checklist *</label>
            <select value={templateId} onChange={e => setTemplateId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Chọn mẫu —</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.task_count} việc)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ngày bắt đầu</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex-shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Hủy</button>
          <button onClick={() => mut.mutate()} disabled={!selectedEmp || !templateId || mut.isPending}
            className="px-5 py-2 text-sm font-medium bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50">
            {mut.isPending ? 'Đang tạo...' : 'Tạo checklist'}
          </button>
        </div>
      </div>
    </ResizableModal>
  )
}

// ── New template modal ───────────────────────────────────────────
function emptyTask(): TemplateTaskInput {
  return { title: '', description: '', category: 'GENERAL', dueDays: 3, isRequired: true }
}

function NewTemplateModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tasks, setTasks] = useState<TemplateTaskInput[]>([emptyTask()])

  const updateTask = (i: number, patch: Partial<TemplateTaskInput>) =>
    setTasks(ts => ts.map((t, idx) => idx === i ? { ...t, ...patch } : t))
  const removeTask = (i: number) => setTasks(ts => ts.filter((_, idx) => idx !== i))
  const addTask = () => setTasks(ts => [...ts, emptyTask()])

  const validTasks = tasks.filter(t => t.title.trim().length > 0)
  const canSubmit = name.trim().length > 0 && validTasks.length > 0

  const mut = useMutation({
    mutationFn: () => createTemplate({ name, description, tasks: validTasks }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ob-templates'] }); onClose() },
  })

  return (
    <ResizableModal onClose={onClose} defaultWidth={640} defaultHeight={640}>
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Tạo mẫu checklist onboarding</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tên mẫu *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Ví dụ: Quy trình tiếp nhận bác sĩ mới"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mô tả</label>
            <input value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Mô tả ngắn gọn về mẫu checklist này"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-gray-600">Danh sách công việc *</label>
              <button onClick={addTask}
                className="text-xs font-medium text-blue-600 hover:text-blue-800">+ Thêm việc</button>
            </div>
            <div className="space-y-3">
              {tasks.map((t, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-semibold text-gray-400 mt-2 w-4 flex-shrink-0">{i + 1}.</span>
                    <input value={t.title} onChange={e => updateTask(i, { title: e.target.value })}
                      placeholder="Tên công việc..."
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button onClick={() => removeTask(i)} disabled={tasks.length === 1}
                      className="flex-shrink-0 text-gray-300 hover:text-red-500 disabled:opacity-30 disabled:hover:text-gray-300 text-lg leading-none px-1">×</button>
                  </div>
                  <div className="flex items-center gap-2 pl-6">
                    <select value={t.category} onChange={e => updateTask(i, { category: e.target.value })}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>{label}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                      Hạn:
                      <input type="number" min={0} value={t.dueDays}
                        onChange={e => updateTask(i, { dueDays: parseInt(e.target.value) || 0 })}
                        className="w-14 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      ngày
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-gray-500 ml-auto flex-shrink-0">
                      <input type="checkbox" checked={t.isRequired}
                        onChange={e => updateTask(i, { isRequired: e.target.checked })}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600" />
                      Bắt buộc
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Hủy</button>
          <button onClick={() => mut.mutate()} disabled={!canSubmit || mut.isPending}
            className="px-5 py-2 text-sm font-medium bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50">
            {mut.isPending ? 'Đang tạo...' : 'Tạo mẫu'}
          </button>
        </div>
      </div>
    </ResizableModal>
  )
}

// ── Main page ───────────────────────────────────────────────────
export default function OnboardingPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showNew, setShowNew]        = useState(false)
  const [showNewTemplate, setShowNewTemplate] = useState(false)
  const [search, setSearch]          = useState('')

  const { data: stats } = useQuery({ queryKey: ['ob-stats'], queryFn: getOnboardingStats })
  const { data: checklists = [], isLoading } = useQuery({
    queryKey: ['checklists'], queryFn: () => getChecklists(),
  })

  const filtered = checklists.filter(c =>
    !search || c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.employee_code?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Onboarding</h1>
          <p className="text-sm text-gray-500 mt-0.5">Theo dõi quy trình tiếp nhận nhân viên mới</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowNewTemplate(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50">
            <span className="text-lg leading-none">+</span> Tạo mẫu checklist
          </button>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-xl hover:bg-blue-800">
            <span className="text-lg leading-none">+</span> Tạo checklist
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Tổng checklist"   value={String(stats.total_checklists ?? 0)}  color="text-gray-900" />
          <StatCard label="Đang thực hiện"   value={String(stats.in_progress ?? 0)}       color="text-blue-600" />
          <StatCard label="Hoàn thành"       value={String(stats.completed ?? 0)}          color="text-green-600" />
          <StatCard label="Công việc quá hạn" value={String(stats.overdue_tasks ?? 0)}    color="text-red-600" />
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tìm nhân viên..." />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-medium">Chưa có checklist nào</p>
            <p className="text-sm mt-1">Tạo checklist cho nhân viên mới nhận vào</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nhân viên</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Phòng ban</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ngày bắt đầu</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tiến độ</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Trạng thái</th>
                <th className="px-4 py-3"/>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(c => {
                const pct = c.total_tasks ? Math.round(((c.done_tasks ?? 0) / c.total_tasks) * 100) : 0
                return (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{c.full_name}</p>
                      <p className="text-xs text-gray-400">{c.employee_code}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.department_name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.start_date ? new Date(c.start_date).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }}/>
                        </div>
                        <span className="text-xs text-gray-500">{pct}%</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{c.done_tasks ?? 0}/{c.total_tasks ?? 0} việc</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        c.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        c.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {c.status === 'COMPLETED' ? 'Hoàn thành' :
                         c.status === 'IN_PROGRESS' ? 'Đang thực hiện' : 'Mới'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelectedId(c.id)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                        Chi tiết →
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {selectedId && <ChecklistModal id={selectedId} onClose={() => setSelectedId(null)} />}
      {showNew && <NewChecklistModal onClose={() => setShowNew(false)} />}
      {showNewTemplate && <NewTemplateModal onClose={() => setShowNewTemplate(false)} />}
    </div>
  )
}
