'use client'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPeriods, getGoals, getEvaluations, getEvaluation, upsertEvaluation,
  createGoal, updateGoalScore, createPeriod, getKpiStats,
  RATING_LABELS, RATING_COLORS, GOAL_CATEGORIES, EVAL_STATUS_LABELS,
  type KpiPeriod, type KpiGoal, type KpiEvaluation,
} from '@/lib/kpi'
import { ResizableModal } from '@/components/resizable-modal'

// ── Rating badge ────────────────────────────────────────────────
function RatingBadge({ rating }: { rating?: string }) {
  if (!rating) return <span className="text-xs text-gray-400">—</span>
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${RATING_COLORS[rating] ?? 'bg-gray-100 text-gray-600'}`}>
      {RATING_LABELS[rating] ?? rating}
    </span>
  )
}

// ── Goal score modal ────────────────────────────────────────────
function ScoreModal({ goal, onClose }: { goal: KpiGoal; onClose: () => void }) {
  const qc = useQueryClient()
  const [actualValue, setActualValue] = useState(String(goal.actual_value ?? ''))
  const [score, setScore] = useState(String(goal.score ?? ''))

  const mut = useMutation({
    mutationFn: () => updateGoalScore(goal.id, {
      actualValue: actualValue || undefined,
      score: score || undefined,
      status: 'ACTIVE',
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['kpi-goals'] }); onClose() },
  })

  return (
    <ResizableModal onClose={onClose} defaultWidth={420} defaultHeight={340}>
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Cập nhật kết quả</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <p className="text-sm text-gray-700 font-medium">{goal.title}</p>
          {goal.target_value !== undefined && (
            <p className="text-xs text-gray-400">Mục tiêu: {goal.target_value} {goal.target_unit}</p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Kết quả thực tế</label>
              <input type="number" value={actualValue} onChange={e => setActualValue(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={goal.target_unit ?? ''} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Điểm (0–100)</label>
              <input type="number" min="0" max="100" value={score} onChange={e => setScore(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0–100" />
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Hủy</button>
          <button onClick={() => mut.mutate()} disabled={mut.isPending}
            className="px-5 py-2 text-sm font-medium bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50">
            Lưu
          </button>
        </div>
      </div>
    </ResizableModal>
  )
}

// ── Evaluation detail modal ─────────────────────────────────────
function EvalModal({ periodId, employeeId, onClose }: { periodId: string; employeeId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const { data: ev, isLoading } = useQuery({
    queryKey: ['kpi-eval', periodId, employeeId],
    queryFn: () => getEvaluation(periodId, employeeId),
  })
  const [selfReview, setSelfReview]     = useState(ev?.self_review ?? '')
  const [managerReview, setManagerReview] = useState(ev?.manager_review ?? '')
  const [strengths, setStrengths]       = useState(ev?.strengths ?? '')
  const [improvements, setImprovements] = useState(ev?.improvements ?? '')
  const [scoreModal, setScoreModal]     = useState<KpiGoal | null>(null)

  const mut = useMutation({
    mutationFn: (status: string) => upsertEvaluation(periodId, employeeId, {
      selfReview, managerReview, strengths, improvements, status,
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kpi-eval', periodId, employeeId] }),
  })

  if (isLoading) return (
    <ResizableModal onClose={onClose} defaultWidth={780} defaultHeight={680}>
      <div className="flex items-center justify-center h-full text-gray-400">Đang tải...</div>
    </ResizableModal>
  )

  const goals = (ev?.goals ?? []) as KpiGoal[]
  const totalWeight = goals.reduce((s, g) => s + (g.weight ?? 0), 0)

  return (
    <ResizableModal onClose={onClose} defaultWidth={780} defaultHeight={680}>
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{ev?.full_name ?? '—'}</h2>
            <p className="text-sm text-gray-500">{ev?.employee_code} · {ev?.department_name}</p>
          </div>
          <div className="flex items-center gap-4">
            {ev?.total_score !== undefined && ev?.total_score !== null && (
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{Number(ev.total_score).toFixed(1)}</p>
                <RatingBadge rating={ev.rating} />
              </div>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Goals */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Mục tiêu & Kết quả ({totalWeight}% trọng số)</p>
            <div className="space-y-2">
              {goals.map(g => (
                <div key={g.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{g.title}</p>
                    <p className="text-xs text-gray-400">
                      {GOAL_CATEGORIES[g.category] ?? g.category} · Trọng số {g.weight}%
                      {g.target_value !== undefined && ` · Mục tiêu: ${g.target_value} ${g.target_unit ?? ''}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {g.score !== null && g.score !== undefined ? (
                      <p className="text-lg font-bold text-blue-600">{Number(g.score).toFixed(0)}</p>
                    ) : (
                      <p className="text-sm text-gray-300">—</p>
                    )}
                    <p className="text-xs text-gray-400">{g.actual_value !== undefined && g.actual_value !== null ? g.actual_value : '—'} {g.target_unit ?? ''}</p>
                  </div>
                  <button onClick={() => setScoreModal(g)}
                    className="flex-shrink-0 text-xs px-2 py-1 border border-gray-200 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600">
                    Nhập
                  </button>
                </div>
              ))}
              {goals.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">Chưa có mục tiêu nào</p>}
            </div>
          </div>

          {/* Review texts */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tự đánh giá</label>
              <textarea value={ev?.self_review ?? selfReview}
                onChange={e => setSelfReview(e.target.value)}
                rows={4} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhân viên tự nhận xét..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nhận xét quản lý</label>
              <textarea value={ev?.manager_review ?? managerReview}
                onChange={e => setManagerReview(e.target.value)}
                rows={4} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Quản lý nhận xét..." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Điểm mạnh</label>
              <textarea value={ev?.strengths ?? strengths} onChange={e => setStrengths(e.target.value)}
                rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Những điểm tốt cần phát huy..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cần cải thiện</label>
              <textarea value={ev?.improvements ?? improvements} onChange={e => setImprovements(e.target.value)}
                rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Điểm cần cải thiện trong kỳ tới..." />
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 flex justify-between items-center gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            ev?.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
            ev?.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {EVAL_STATUS_LABELS[ev?.status ?? ''] ?? 'Mới'}
          </span>
          <div className="flex gap-3">
            <button onClick={() => mut.mutate('SELF_REVIEW')} disabled={mut.isPending}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              Lưu nháp
            </button>
            <button onClick={() => mut.mutate('SUBMITTED')} disabled={mut.isPending}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              Nộp đánh giá
            </button>
            <button onClick={() => mut.mutate('APPROVED')} disabled={mut.isPending}
              className="px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium">
              Phê duyệt
            </button>
          </div>
        </div>
      </div>
      {scoreModal && <ScoreModal goal={scoreModal} onClose={() => setScoreModal(null)} />}
    </ResizableModal>
  )
}

// ── Main page ───────────────────────────────────────────────────
export default function KpiPage() {
  const qc = useQueryClient()
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('')
  const [evalTarget, setEvalTarget]              = useState<{ periodId: string; employeeId: string } | null>(null)
  const [tab, setTab]                            = useState<'evaluations' | 'goals'>('evaluations')

  const { data: periods = [] } = useQuery({
    queryKey: ['kpi-periods'], queryFn: getPeriods,
  })

  useEffect(() => {
    if (!selectedPeriodId && (periods as KpiPeriod[]).length) {
      setSelectedPeriodId((periods as KpiPeriod[])[0].id)
    }
  }, [periods]) // eslint-disable-line react-hooks/exhaustive-deps

  const period = (periods as KpiPeriod[]).find(p => p.id === selectedPeriodId)

  const { data: evaluations = [] } = useQuery({
    queryKey: ['kpi-evals', selectedPeriodId],
    queryFn: () => getEvaluations(selectedPeriodId),
    enabled: !!selectedPeriodId && tab === 'evaluations',
  })

  const { data: goals = [] } = useQuery({
    queryKey: ['kpi-goals', selectedPeriodId],
    queryFn: () => getGoals(selectedPeriodId),
    enabled: !!selectedPeriodId && tab === 'goals',
  })

  const { data: stats } = useQuery({
    queryKey: ['kpi-stats', selectedPeriodId],
    queryFn: () => getKpiStats(selectedPeriodId || undefined),
    enabled: !!selectedPeriodId,
  })

  const evals = evaluations as KpiEvaluation[]
  const evalStats = (stats as any)?.evaluations

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Đánh giá KPI</h1>
          <p className="text-sm text-gray-500 mt-0.5">Quản lý mục tiêu và đánh giá hiệu suất nhân viên</p>
        </div>
        {/* Period selector */}
        <select value={selectedPeriodId} onChange={e => setSelectedPeriodId(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">— Chọn kỳ —</option>
          {(periods as KpiPeriod[]).map(p => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.status === 'OPEN' ? 'Đang mở' : p.status === 'CLOSED' ? 'Đã đóng' : p.status})
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      {evalStats && (
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Tổng nhân viên</p>
            <p className="text-2xl font-bold text-gray-900">{evalStats.total ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Đang tự đánh giá</p>
            <p className="text-2xl font-bold text-blue-600">{evalStats.in_review ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Đã nộp</p>
            <p className="text-2xl font-bold text-amber-600">{evalStats.submitted ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Đã phê duyệt</p>
            <p className="text-2xl font-bold text-green-600">{evalStats.approved ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Điểm TB</p>
            <p className="text-2xl font-bold text-purple-600">
              {evalStats.avg_score != null ? Number(evalStats.avg_score).toFixed(1) : '—'}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {(['evaluations', 'goals'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`py-2.5 px-5 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t === 'evaluations' ? 'Đánh giá' : 'Mục tiêu'}
          </button>
        ))}
      </div>

      {/* Content */}
      {!selectedPeriodId ? (
        <div className="py-16 text-center text-gray-400">
          <p className="text-4xl mb-3">📊</p>
          <p className="font-medium">Chọn kỳ đánh giá để xem dữ liệu</p>
        </div>
      ) : tab === 'evaluations' ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {evals.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <p className="text-4xl mb-3">📝</p>
              <p className="font-medium">Chưa có đánh giá nào trong kỳ này</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nhân viên</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Phòng ban</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Điểm</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Xếp loại</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Trạng thái</th>
                  <th className="px-4 py-3"/>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {evals.map(ev => (
                  <tr key={ev.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{ev.full_name}</p>
                      <p className="text-xs text-gray-400">{ev.employee_code}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{ev.department_name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-lg font-bold text-gray-900">
                        {ev.total_score != null ? Number(ev.total_score).toFixed(1) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3"><RatingBadge rating={ev.rating} /></td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        ev.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        ev.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {EVAL_STATUS_LABELS[ev.status] ?? ev.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setEvalTarget({ periodId: selectedPeriodId, employeeId: ev.employee_id })}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                        Chi tiết →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* Goals tab */
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {(goals as KpiGoal[]).length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <p className="text-4xl mb-3">🎯</p>
              <p className="font-medium">Chưa có mục tiêu nào trong kỳ này</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Mục tiêu</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nhân viên</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Phân loại</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Trọng số</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Điểm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(goals as KpiGoal[]).map(g => (
                  <tr key={g.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800">{g.title}</p>
                      {g.target_value !== undefined && (
                        <p className="text-xs text-gray-400">Mục tiêu: {g.target_value} {g.target_unit}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-800">{g.full_name}</p>
                      <p className="text-xs text-gray-400">{g.department_name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                        {GOAL_CATEGORIES[g.category] ?? g.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{g.weight}%</td>
                    <td className="px-4 py-3 text-right">
                      {g.score != null ? (
                        <span className="font-bold text-blue-600">{Number(g.score).toFixed(0)}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {evalTarget && (
        <EvalModal
          periodId={evalTarget.periodId}
          employeeId={evalTarget.employeeId}
          onClose={() => setEvalTarget(null)}
        />
      )}
    </div>
  )
}
