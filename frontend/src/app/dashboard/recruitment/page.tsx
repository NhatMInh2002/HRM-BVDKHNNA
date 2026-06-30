'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { RichEditor } from '@/components/rich-editor'
import { ResizableModal } from '@/components/resizable-modal'

// ── Types ──────────────────────────────────────────────────────────────────

interface JobPosting {
  id: string
  title: string
  position: string
  quantity: number
  salaryRange: string
  deadline: string
  status: string
  deptName: string
  deptCode: string
  candidateCount: number
  activeCandidates: number
  createdAt: string
}

interface Candidate {
  id: string
  fullName: string
  email: string
  phone: string
  stage: string
  source: string
  cvUrl: string
  notes: string
  postingTitle: string
  interviewCount: number
  lastInterview: string
  createdAt: string
}

// ── Constants ──────────────────────────────────────────────────────────────

const STAGES = ['NEW', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'] as const
const STAGE_LABELS: Record<string, string> = {
  NEW: 'Mới nộp',
  SCREENING: 'Xét hồ sơ',
  INTERVIEW: 'Phỏng vấn',
  OFFER: 'Đề xuất lương',
  HIRED: 'Đã tuyển',
  REJECTED: 'Loại',
}
const STAGE_COLORS: Record<string, string> = {
  NEW: 'bg-gray-100 text-gray-700',
  SCREENING: 'bg-blue-100 text-blue-700',
  INTERVIEW: 'bg-yellow-100 text-yellow-700',
  OFFER: 'bg-purple-100 text-purple-700',
  HIRED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
}
const SOURCE_LABELS: Record<string, string> = {
  DIRECT: 'Nộp trực tiếp',
  REFERRAL: 'Giới thiệu nội bộ',
  HEADHUNT: 'Headhunt',
  ONLINE_JOB: 'Trang tuyển dụng',
  LINKEDIN: 'LinkedIn',
  OTHER: 'Khác',
}

// ── API helpers ────────────────────────────────────────────────────────────

const fetchPostings = (status: string) =>
  apiFetch<JobPosting[]>(`/recruitment/postings?status=${status}`)
const fetchCandidates = (postingId?: string) =>
  apiFetch<Candidate[]>(`/recruitment/candidates${postingId ? `?postingId=${postingId}` : ''}`)
const fetchStats = () => apiFetch<Record<string, Record<string, number>>>('/recruitment/stats')

// ── Main Component ─────────────────────────────────────────────────────────

export default function RecruitmentPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'postings' | 'pipeline'>('postings')
  const [selectedPosting, setSelectedPosting] = useState<string | null>(null)
  const [postingStatusFilter, setPostingStatusFilter] = useState('OPEN')
  const [showNewPosting, setShowNewPosting] = useState(false)
  const [showNewCandidate, setShowNewCandidate] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)

  const { data: stats } = useQuery({ queryKey: ['recruitment-stats'], queryFn: fetchStats })
  const { data: postings = [] } = useQuery({
    queryKey: ['postings', postingStatusFilter],
    queryFn: () => fetchPostings(postingStatusFilter),
  })
  const { data: candidates = [] } = useQuery({
    queryKey: ['candidates', selectedPosting],
    queryFn: () => fetchCandidates(selectedPosting ?? undefined),
    enabled: tab === 'pipeline',
  })

  const moveStage = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      apiFetch(`/recruitment/candidates/${id}/stage?stage=${stage}`, { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidates'] }),
  })

  const updatePostingStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/recruitment/postings/${id}/status?status=${status}`, { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['postings'] }),
  })

  const s = stats as any
  const postingStats = s?.postings ?? {}
  const candidateStats = s?.candidates ?? {}

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tuyển dụng</h1>
          <p className="text-sm text-gray-500 mt-0.5">Quản lý tin tuyển dụng và pipeline ứng viên</p>
        </div>
        <button
          onClick={() => setShowNewPosting(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Đăng tin mới
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Tin đang mở', value: postingStats.open_postings ?? 0, color: 'text-blue-600' },
          { label: 'Hết hạn', value: postingStats.overdue ?? 0, color: 'text-red-600' },
          { label: 'Ứng viên mới', value: candidateStats.new_count ?? 0, color: 'text-gray-600' },
          { label: 'Đang phỏng vấn', value: candidateStats.interview ?? 0, color: 'text-yellow-600' },
          { label: 'Đề xuất lương', value: candidateStats.offer ?? 0, color: 'text-purple-600' },
          { label: 'Đã tuyển được', value: candidateStats.hired ?? 0, color: 'text-green-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-6">
        {(['postings', 'pipeline'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t === 'postings' ? '📋 Tin tuyển dụng' : '👥 Pipeline ứng viên'}
          </button>
        ))}
      </div>

      {/* ── Tab: Tin tuyển dụng ── */}
      {tab === 'postings' && (
        <div>
          <div className="flex gap-2 mb-4">
            {['OPEN', 'DRAFT', 'CLOSED', 'ALL'].map(s => (
              <button
                key={s}
                onClick={() => setPostingStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  postingStatusFilter === s
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 text-gray-600 hover:border-blue-400'
                }`}
              >
                {s === 'OPEN' ? 'Đang mở' : s === 'DRAFT' ? 'Nháp' : s === 'CLOSED' ? 'Đã đóng' : 'Tất cả'}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {postings.length === 0 && (
              <div className="text-center py-12 text-gray-400">Chưa có tin tuyển dụng nào.</div>
            )}
            {postings.map((p: any) => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{p.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        p.status === 'OPEN' ? 'bg-green-100 text-green-700'
                        : p.status === 'DRAFT' ? 'bg-gray-100 text-gray-600'
                        : 'bg-red-100 text-red-600'
                      }`}>{p.status === 'OPEN' ? 'Đang mở' : p.status === 'DRAFT' ? 'Nháp' : 'Đã đóng'}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-500">
                      <span>🏢 {p.dept_name || 'Chưa phân phòng'}</span>
                      <span>👥 Cần: {p.quantity} người</span>
                      {p.salary_range && <span>💰 {p.salary_range}</span>}
                      {p.deadline && (
                        <span className={new Date(p.deadline) < new Date() ? 'text-red-500' : ''}>
                          📅 Hạn: {new Date(p.deadline).toLocaleDateString('vi-VN')}
                          {new Date(p.deadline) < new Date() ? ' (Quá hạn)' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <div className="text-right text-sm">
                      <div className="font-medium text-gray-900">{p.candidate_count ?? 0}</div>
                      <div className="text-xs text-gray-400">ứng viên</div>
                    </div>
                    <button
                      onClick={() => { setSelectedPosting(p.id); setTab('pipeline') }}
                      className="px-3 py-1 text-xs rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                    >
                      Xem pipeline
                    </button>
                    {p.status === 'OPEN' && (
                      <button
                        onClick={() => updatePostingStatus.mutate({ id: p.id, status: 'CLOSED' })}
                        className="px-3 py-1 text-xs rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                      >
                        Đóng tin
                      </button>
                    )}
                    {p.status === 'DRAFT' && (
                      <button
                        onClick={() => updatePostingStatus.mutate({ id: p.id, status: 'OPEN' })}
                        className="px-3 py-1 text-xs rounded-lg bg-green-50 text-green-600 hover:bg-green-100"
                      >
                        Mở tin
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Pipeline ── */}
      {tab === 'pipeline' && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <select
              value={selectedPosting ?? ''}
              onChange={e => setSelectedPosting(e.target.value || null)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả tin tuyển dụng</option>
              {postings.map((p: any) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
            <button
              onClick={() => setShowNewCandidate(true)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              + Thêm ứng viên
            </button>
          </div>

          {/* Kanban board — kéo thả để chuyển giai đoạn */}
          <div className="grid grid-cols-3 xl:grid-cols-6 gap-3 overflow-x-auto">
            {STAGES.map(stage => {
              const stageCandidates = candidates.filter((c: any) => c.stage === stage)
              const isDragOver = dragOverStage === stage
              return (
                <div
                  key={stage}
                  className="min-w-[180px]"
                  onDragOver={e => { e.preventDefault(); setDragOverStage(stage) }}
                  onDragLeave={() => setDragOverStage(s => (s === stage ? null : s))}
                  onDrop={e => {
                    e.preventDefault()
                    const id = e.dataTransfer.getData('text/plain') || draggedId
                    setDragOverStage(null)
                    setDraggedId(null)
                    if (!id) return
                    const dragged = candidates.find((c: any) => c.id === id)
                    if (dragged && dragged.stage !== stage) {
                      moveStage.mutate({ id, stage })
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STAGE_COLORS[stage]}`}>
                      {STAGE_LABELS[stage]}
                    </span>
                    <span className="text-xs text-gray-400">{stageCandidates.length}</span>
                  </div>
                  <div className={`space-y-2 min-h-[200px] rounded-lg transition-colors ${
                    isDragOver ? 'bg-blue-50/70 ring-2 ring-blue-300 ring-inset' : ''
                  }`}>
                    {stageCandidates.map((c: any) => (
                      <div
                        key={c.id}
                        draggable
                        onDragStart={e => {
                          e.dataTransfer.setData('text/plain', c.id)
                          e.dataTransfer.effectAllowed = 'move'
                          setDraggedId(c.id)
                        }}
                        onDragEnd={() => { setDraggedId(null); setDragOverStage(null) }}
                        onClick={() => setSelectedCandidate(c)}
                        className={`bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all ${
                          draggedId === c.id ? 'opacity-40 scale-95' : ''
                        }`}
                      >
                        <div className="font-medium text-sm text-gray-900 truncate">{c.full_name}</div>
                        <div className="text-xs text-gray-500 truncate mt-0.5">{c.posting_title || '—'}</div>
                        {c.interview_count > 0 && (
                          <div className="text-xs text-blue-500 mt-1">🎤 {c.interview_count} lần PV</div>
                        )}
                        <div className="text-[10px] text-gray-400 mt-1">{SOURCE_LABELS[c.source] || c.source}</div>
                      </div>
                    ))}
                    {stageCandidates.length === 0 && (
                      <div className={`h-20 border-2 border-dashed rounded-lg flex items-center justify-center text-xs transition-colors ${
                        isDragOver ? 'border-blue-300 text-blue-400' : 'border-gray-200 text-gray-300'
                      }`}>
                        {isDragOver ? 'Thả vào đây' : 'Trống'}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-400 mt-3">💡 Kéo thả thẻ ứng viên giữa các cột để chuyển giai đoạn</p>
        </div>
      )}

      {/* ── Modal: New Posting ── */}
      {showNewPosting && (
        <NewPostingModal
          onClose={() => setShowNewPosting(false)}
          onCreated={() => { setShowNewPosting(false); qc.invalidateQueries({ queryKey: ['postings'] }) }}
        />
      )}

      {/* ── Modal: New Candidate ── */}
      {showNewCandidate && (
        <NewCandidateModal
          postings={postings}
          defaultPostingId={selectedPosting ?? ''}
          onClose={() => setShowNewCandidate(false)}
          onCreated={() => { setShowNewCandidate(false); qc.invalidateQueries({ queryKey: ['candidates'] }) }}
        />
      )}

      {/* ── Drawer: Candidate detail ── */}
      {selectedCandidate && (
        <CandidateDrawer
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          onStageChanged={() => { setSelectedCandidate(null); qc.invalidateQueries({ queryKey: ['candidates'] }) }}
        />
      )}
    </div>
  )
}


// ── Sub-components ─────────────────────────────────────────────────────────

function NewPostingModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: '', position: '', quantity: '1', departmentId: '',
    description: '', requirements: '', benefits: '',
    salaryRange: '', deadline: '', status: 'OPEN',
  })
  const [activeSection, setActiveSection] = useState<'description' | 'requirements' | 'benefits'>('description')
  const [loading, setLoading] = useState(false)

  // Fetch danh sách phòng ban để chọn
  const { data: depts = [] } = useQuery({
    queryKey: ['departments-list'],
    queryFn: () => apiFetch<any[]>('/departments'),
  })

  const submit = async () => {
    if (!form.title) return
    setLoading(true)
    try {
      await apiFetch('/recruitment/postings', { method: 'POST', body: JSON.stringify(form) })
      onCreated()
    } finally { setLoading(false) }
  }

  const sectionTabs = [
    { key: 'description' as const, label: '📋 Mô tả công việc' },
    { key: 'requirements' as const, label: '✅ Yêu cầu ứng viên' },
    { key: 'benefits' as const, label: '🎁 Quyền lợi & Phúc lợi' },
  ]

  return (
    <ResizableModal onClose={onClose} defaultWidth={980} defaultHeight={680} minWidth={600} minHeight={400}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Đăng tin tuyển dụng mới</h2>
            <p className="text-xs text-gray-400 mt-0.5">Tạo tin tuyển dụng như một bài viết — có định dạng, ảnh minh họa và bảng</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">✕</button>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left: meta fields */}
          <div className="w-72 flex-shrink-0 border-r bg-gray-50 overflow-y-auto p-5 space-y-4">
            <Field label="Tiêu đề tin *">
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className={inputCls}
                placeholder="VD: Điều dưỡng hạng III — Khoa Ngoại"
              />
            </Field>

            <Field label="Vị trí tuyển dụng">
              <input
                value={form.position}
                onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                className={inputCls}
                placeholder="Điều dưỡng hạng III"
              />
            </Field>

            <Field label="Phòng ban / Khoa">
              <select
                value={form.departmentId}
                onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))}
                className={inputCls}
              >
                <option value="">Chưa chọn</option>
                {(depts as any[]).map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Số lượng cần tuyển">
              <input
                type="number" min={1}
                value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                className={inputCls}
              />
            </Field>

            <Field label="Mức lương / Hệ số">
              <input
                value={form.salaryRange}
                onChange={e => setForm(f => ({ ...f, salaryRange: e.target.value }))}
                className={inputCls}
                placeholder="VD: Ngạch A1, hệ số 2.34–3.00"
              />
            </Field>

            <Field label="Hạn nộp hồ sơ">
              <input
                type="date"
                value={form.deadline}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                className={inputCls}
              />
            </Field>

            <Field label="Trạng thái">
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className={inputCls}
              >
                <option value="DRAFT">📝 Nháp — lưu, chưa mở</option>
                <option value="OPEN">🟢 Mở ngay</option>
              </select>
            </Field>

            {/* Preview card */}
            {form.title && (
              <div className="mt-4 p-3 bg-white border border-blue-200 rounded-xl text-xs text-gray-600 space-y-1">
                <div className="font-semibold text-gray-900 text-sm leading-tight">{form.title}</div>
                {form.position && <div>🏥 {form.position}</div>}
                {form.quantity && <div>👥 Cần: {form.quantity} người</div>}
                {form.salaryRange && <div>💰 {form.salaryRange}</div>}
                {form.deadline && <div>📅 Hạn: {new Date(form.deadline).toLocaleDateString('vi-VN')}</div>}
                <div className={`inline-block px-2 py-0.5 rounded-full mt-1 font-medium ${form.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {form.status === 'OPEN' ? '🟢 Đang mở' : '📝 Nháp'}
                </div>
              </div>
            )}
          </div>

          {/* Right: rich content editor */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Section tabs */}
            <div className="flex border-b bg-white flex-shrink-0 px-2 pt-2 gap-1">
              {sectionTabs.map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveSection(t.key)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2
                    ${activeSection === t.key
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                  {t.label}
                  {form[t.key] && form[t.key] !== '<br>' && (
                    <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 inline-block align-middle" />
                  )}
                </button>
              ))}
            </div>

            {/* Editor per tab */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeSection === 'description' && (
                <RichEditor
                  value={form.description}
                  onChange={v => setForm(f => ({ ...f, description: v }))}
                  placeholder="Mô tả nhiệm vụ, trách nhiệm chính của vị trí này. Có thể chèn ảnh minh họa, bảng phân công..."
                  minHeight={340}
                />
              )}
              {activeSection === 'requirements' && (
                <RichEditor
                  value={form.requirements}
                  onChange={v => setForm(f => ({ ...f, requirements: v }))}
                  placeholder="Yêu cầu về bằng cấp, chứng chỉ hành nghề, kinh nghiệm, kỹ năng..."
                  minHeight={340}
                />
              )}
              {activeSection === 'benefits' && (
                <RichEditor
                  value={form.benefits}
                  onChange={v => setForm(f => ({ ...f, benefits: v }))}
                  placeholder="Quyền lợi, phúc lợi, chế độ đãi ngộ (BHXH, BHYT, thưởng, đào tạo...)..."
                  minHeight={340}
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 flex-shrink-0">
          <div className="text-xs text-gray-400">
            Nội dung hỗ trợ định dạng phong phú: tiêu đề, danh sách, bảng, ảnh
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-100">
              Hủy
            </button>
            <button
              onClick={() => { setForm(f => ({ ...f, status: 'DRAFT' })); submit() }}
              disabled={loading || !form.title}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-40"
            >
              💾 Lưu nháp
            </button>
            <button
              onClick={submit}
              disabled={loading || !form.title}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : '🟢 Đăng tin ngay'}
            </button>
          </div>
        </div>
      </div>
    </ResizableModal>
  )
}

function NewCandidateModal({ postings, defaultPostingId, onClose, onCreated }:
  { postings: any[]; defaultPostingId: string; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', jobPostingId: defaultPostingId, source: 'DIRECT', cvUrl: '', notes: '',
  })
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!form.fullName) return
    setLoading(true)
    try {
      await apiFetch('/recruitment/candidates', { method: 'POST', body: JSON.stringify(form) })
      onCreated()
    } finally { setLoading(false) }
  }

  return (
    <ResizableModal onClose={onClose} defaultWidth={480} defaultHeight={540} minWidth={340} minHeight={300}>
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">Thêm ứng viên</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <Field label="Họ tên *">
            <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
              className={inputCls} placeholder="Nguyễn Thị Hoa" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className={inputCls} />
            </Field>
            <Field label="Điện thoại">
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className={inputCls} placeholder="09xxxxxxxx" />
            </Field>
          </div>
          <Field label="Ứng tuyển vị trí">
            <select value={form.jobPostingId} onChange={e => setForm(f => ({ ...f, jobPostingId: e.target.value }))} className={inputCls}>
              <option value="">Chưa xác định</option>
              {postings.filter((p: any) => p.status === 'OPEN').map((p: any) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </Field>
          <Field label="Nguồn ứng tuyển">
            <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className={inputCls}>
              {Object.entries(SOURCE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Link CV / Hồ sơ">
            <input value={form.cvUrl} onChange={e => setForm(f => ({ ...f, cvUrl: e.target.value }))}
              className={inputCls} placeholder="https://drive.google.com/..." />
          </Field>
          <Field label="Ghi chú">
            <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className={inputCls} />
          </Field>
        </div>
        <div className="flex-shrink-0 flex justify-end gap-3 p-5 border-t">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border text-sm">Hủy</button>
          <button onClick={submit} disabled={loading || !form.fullName}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Đang lưu...' : 'Thêm ứng viên'}
          </button>
        </div>
      </div>
    </ResizableModal>
  )
}

function CandidateDrawer({ candidate, onClose, onStageChanged }:
  { candidate: Candidate; onClose: () => void; onStageChanged: () => void }) {
  const qc = useQueryClient()
  const c = candidate as any

  const { data: interviews = [] } = useQuery({
    queryKey: ['interviews', c.id],
    queryFn: () => apiFetch<any[]>(`/recruitment/candidates/${c.id}/interviews`),
  })

  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({ scheduledAt: '', interviewType: 'IN_PERSON', interviewer: '', location: '', notes: '' })
  const [scheduleLoading, setScheduleLoading] = useState(false)

  const scheduleInterview = async () => {
    if (!scheduleForm.scheduledAt) return
    setScheduleLoading(true)
    try {
      await apiFetch(`/recruitment/candidates/${c.id}/interviews`, { method: 'POST', body: JSON.stringify(scheduleForm) })
      qc.invalidateQueries({ queryKey: ['interviews', c.id] })
      qc.invalidateQueries({ queryKey: ['candidates'] })
      setShowSchedule(false)
    } finally { setScheduleLoading(false) }
  }

  const moveStage = async (stage: string) => {
    await apiFetch(`/recruitment/candidates/${c.id}/stage?stage=${stage}`, { method: 'PATCH' })
    onStageChanged()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-end z-50">
      <div className="bg-white w-full sm:w-[480px] h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col">
        <div className="flex items-start justify-between p-5 border-b flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{c.full_name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[c.stage]}`}>
                {STAGE_LABELS[c.stage]}
              </span>
              <span className="text-xs text-gray-500">{SOURCE_LABELS[c.source] || c.source}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="p-5 space-y-5 flex-1">
          {/* Thông tin liên hệ */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {c.email && <div><span className="text-gray-400">Email</span><div className="font-medium">{c.email}</div></div>}
            {c.phone && <div><span className="text-gray-400">Điện thoại</span><div className="font-medium">{c.phone}</div></div>}
            {c.posting_title && <div className="col-span-2"><span className="text-gray-400">Vị trí ứng tuyển</span><div className="font-medium">{c.posting_title}</div></div>}
            {c.cv_url && (
              <div className="col-span-2">
                <a href={c.cv_url} target="_blank" className="text-blue-600 text-sm hover:underline">📎 Xem CV / Hồ sơ</a>
              </div>
            )}
            {c.notes && <div className="col-span-2"><span className="text-gray-400">Ghi chú</span><div className="text-gray-700">{c.notes}</div></div>}
          </div>

          {/* Pipeline actions */}
          {c.stage !== 'HIRED' && c.stage !== 'REJECTED' && (
            <div className="border rounded-xl p-4">
              <div className="text-sm font-medium text-gray-700 mb-3">Chuyển giai đoạn</div>
              <div className="flex flex-wrap gap-2">
                {STAGES.filter(s => s !== c.stage && s !== 'NEW').map(s => (
                  <button
                    key={s}
                    onClick={() => moveStage(s)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium ${STAGE_COLORS[s]} hover:opacity-80`}
                  >
                    → {STAGE_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lịch phỏng vấn */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-gray-700">Lịch phỏng vấn</div>
              <button onClick={() => setShowSchedule(!showSchedule)}
                className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                + Lên lịch
              </button>
            </div>

            {showSchedule && (
              <div className="border rounded-xl p-4 mb-3 space-y-3 bg-blue-50/50">
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Thời gian *">
                    <input type="datetime-local" value={scheduleForm.scheduledAt}
                      onChange={e => setScheduleForm(f => ({ ...f, scheduledAt: e.target.value }))}
                      className={inputCls} />
                  </Field>
                  <Field label="Hình thức">
                    <select value={scheduleForm.interviewType}
                      onChange={e => setScheduleForm(f => ({ ...f, interviewType: e.target.value }))}
                      className={inputCls}>
                      <option value="IN_PERSON">Trực tiếp</option>
                      <option value="ONLINE">Online</option>
                      <option value="PHONE">Điện thoại</option>
                    </select>
                  </Field>
                </div>
                <Field label="Người phỏng vấn">
                  <input value={scheduleForm.interviewer}
                    onChange={e => setScheduleForm(f => ({ ...f, interviewer: e.target.value }))}
                    className={inputCls} placeholder="BS. Trưởng khoa..." />
                </Field>
                <Field label="Địa điểm">
                  <input value={scheduleForm.location}
                    onChange={e => setScheduleForm(f => ({ ...f, location: e.target.value }))}
                    className={inputCls} placeholder="Phòng họp tầng 3" />
                </Field>
                <Field label="Ghi chú">
                  <input value={scheduleForm.notes}
                    onChange={e => setScheduleForm(f => ({ ...f, notes: e.target.value }))}
                    className={inputCls} />
                </Field>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowSchedule(false)} className="px-3 py-1 text-sm border rounded-lg">Hủy</button>
                  <button onClick={scheduleInterview} disabled={scheduleLoading || !scheduleForm.scheduledAt}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50">
                    {scheduleLoading ? 'Đang lưu...' : 'Lên lịch'}
                  </button>
                </div>
              </div>
            )}

            {(interviews as any[]).length === 0 && (
              <div className="text-sm text-gray-400 text-center py-4">Chưa có lịch phỏng vấn</div>
            )}
            {(interviews as any[]).map((iv: any) => (
              <div key={iv.id} className="border rounded-lg p-3 text-sm mb-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {new Date(iv.scheduled_at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                    {' — '}
                    {iv.interview_type === 'IN_PERSON' ? 'Trực tiếp' : iv.interview_type === 'ONLINE' ? 'Online' : 'Điện thoại'}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    iv.result === 'PASS' ? 'bg-green-100 text-green-700'
                    : iv.result === 'FAIL' ? 'bg-red-100 text-red-600'
                    : 'bg-gray-100 text-gray-500'
                  }`}>
                    {iv.result === 'PASS' ? '✓ Đạt' : iv.result === 'FAIL' ? '✗ Không đạt' : 'Chờ kết quả'}
                  </span>
                </div>
                {iv.interviewer && <div className="text-gray-500 mt-0.5">👤 {iv.interviewer}</div>}
                {iv.location && <div className="text-gray-500">📍 {iv.location}</div>}
                {iv.notes && <div className="text-gray-600 mt-1 text-xs">{iv.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Micro helpers ──────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none'
