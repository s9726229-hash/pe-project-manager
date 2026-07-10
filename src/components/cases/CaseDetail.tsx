import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import type { Case, CaseStep } from '../../types';
import { getCurrentGroupOrder, nextGroupOrder } from '../../services/caseUtils';
import { newId } from '../../services/storage';

interface CaseDetailProps {
  caseItem: Case;
  onBack: () => void;
  onUpdate: (id: string, patch: Partial<Case>) => void;
  onDelete: (id: string) => void;
}

const STATUS_COLOR: Record<string, string> = {
  待辦: 'text-slate-400',
  進行中: 'text-amber-400',
  已完成: 'text-emerald-400'
};

export default function CaseDetail({ caseItem, onBack, onUpdate, onDelete }: CaseDetailProps) {
  const currentGroup = getCurrentGroupOrder(caseItem.steps);

  function field(patch: Partial<Case>) {
    onUpdate(caseItem.id, patch);
  }

  function updateStep(id: string, patch: Partial<CaseStep>) {
    const steps = caseItem.steps.map((s) => {
      if (s.id !== id) return s;
      const next = { ...s, ...patch };
      if (patch.status === '已完成' && !next.completedDate) next.completedDate = new Date().toISOString().slice(0, 10);
      if (patch.status && patch.status !== '已完成') next.completedDate = undefined;
      return next;
    });
    field({ steps });
  }

  function addStep() {
    const steps = [...caseItem.steps, { id: newId(), name: '新步驟', groupOrder: nextGroupOrder(caseItem.steps), status: '待辦' as const }];
    field({ steps });
  }

  function deleteStep(id: string) {
    field({ steps: caseItem.steps.filter((s) => s.id !== id) });
  }

  function handleDeleteCase() {
    if (!confirm(`確定刪除案件「${caseItem.name}」？`)) return;
    onDelete(caseItem.id);
    onBack();
  }

  const sortedSteps = [...caseItem.steps].sort((a, b) => a.groupOrder - b.groupOrder);

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 mb-4">
        <ArrowLeft size={16} /> 返回案件列表
      </button>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 mb-6 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <input
            className="flex-1 bg-slate-800 rounded px-2 py-1.5 text-lg font-semibold text-slate-100"
            value={caseItem.name}
            onChange={(e) => field({ name: e.target.value })}
          />
          <button onClick={handleDeleteCase} className="text-slate-500 hover:text-red-400 p-1 shrink-0" title="刪除案件">
            <Trash2 size={16} />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <label className="text-xs text-slate-400 space-y-1 block">
            範本類型
            <div className="w-full bg-slate-800/50 rounded px-2 py-1.5 text-sm text-slate-400">{caseItem.caseTypeLabel}</div>
          </label>
          <label className="text-xs text-slate-400 space-y-1 block">
            開案日期
            <input
              type="date"
              className="w-full bg-slate-800 rounded px-2 py-1.5 text-sm"
              value={caseItem.openDate}
              onChange={(e) => field({ openDate: e.target.value })}
            />
          </label>
          <label className="text-xs text-slate-400 space-y-1 block">
            關聯料號
            <input
              className="w-full bg-slate-800 rounded px-2 py-1.5 text-sm"
              value={caseItem.partNumber ?? ''}
              onChange={(e) => field({ partNumber: e.target.value })}
            />
          </label>
          <label className="text-xs text-slate-400 space-y-1 block">
            備註
            <input
              className="w-full bg-slate-800 rounded px-2 py-1.5 text-sm"
              value={caseItem.notes ?? ''}
              onChange={(e) => field({ notes: e.target.value })}
            />
          </label>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        {sortedSteps.map((s) => {
          const isCurrent = s.groupOrder === currentGroup && s.status !== '已完成';
          return (
            <div
              key={s.id}
              className={`flex items-center gap-2 flex-wrap py-2 px-3 rounded-lg border ${
                isCurrent ? 'border-primary-500/60 bg-primary-500/5' : 'border-slate-800 bg-slate-900/60'
              }`}
            >
              <label className="text-xs text-slate-500 flex items-center gap-1 shrink-0">
                並行群組
                <input
                  type="number"
                  className="w-14 bg-slate-800 rounded px-2 py-1 text-xs"
                  value={s.groupOrder}
                  onChange={(e) => updateStep(s.id, { groupOrder: Number(e.target.value) })}
                />
              </label>
              <input
                className="flex-1 min-w-[8rem] bg-transparent outline-none text-sm"
                value={s.name}
                onChange={(e) => updateStep(s.id, { name: e.target.value })}
              />
              <select
                className={`bg-slate-800 rounded px-2 py-1 text-xs shrink-0 ${STATUS_COLOR[s.status]}`}
                value={s.status}
                onChange={(e) => updateStep(s.id, { status: e.target.value as CaseStep['status'] })}
              >
                <option value="待辦">待辦</option>
                <option value="進行中">進行中</option>
                <option value="已完成">已完成</option>
              </select>
              <input
                className="bg-slate-800 rounded px-2 py-1 text-xs w-20 shrink-0"
                placeholder="負責人"
                value={s.owner ?? ''}
                onChange={(e) => updateStep(s.id, { owner: e.target.value })}
              />
              <span className="text-xs text-slate-500 w-24 shrink-0">{s.completedDate ?? ''}</span>
              <button onClick={() => deleteStep(s.id)} className="text-slate-500 hover:text-red-400 p-1 shrink-0" title="刪除步驟">
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>
      <button onClick={addStep} className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
        <Plus size={14} /> 新增步驟
      </button>
    </div>
  );
}
