import { Plus } from 'lucide-react';
import type { Case } from '../../types';
import { computeCaseProgress, getCurrentStepNames, isCaseDone } from '../../services/caseUtils';

interface CaseListProps {
  cases: Case[];
  onOpen: (id: string) => void;
  onNewCase: () => void;
}

export default function CaseList({ cases, onOpen, onNewCase }: CaseListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-300">問題/ECN/替代料案件</h2>
        <button
          onClick={onNewCase}
          className="flex items-center gap-1 text-sm bg-primary-600 hover:bg-primary-500 rounded-lg px-3 py-1.5"
        >
          <Plus size={16} /> 新增案件
        </button>
      </div>

      {cases.length === 0 && <p className="text-slate-500 text-sm">還沒有案件。</p>}

      {cases.length > 0 && (
        <div className="border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-slate-400 text-xs">
              <tr>
                <th className="text-left px-4 py-2">案件名稱</th>
                <th className="text-left px-4 py-2">類型</th>
                <th className="text-left px-4 py-2">開案日期</th>
                <th className="text-left px-4 py-2">目前卡在</th>
                <th className="text-left px-4 py-2">進度%</th>
                <th className="text-left px-4 py-2">狀態</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => {
                const done = isCaseDone(c);
                const currentSteps = getCurrentStepNames(c);
                return (
                  <tr key={c.id} className="border-t border-slate-800 hover:bg-slate-900/60 cursor-pointer" onClick={() => onOpen(c.id)}>
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-slate-400">{c.caseTypeLabel}</td>
                    <td className="px-4 py-3 text-slate-400">{c.openDate}</td>
                    <td className="px-4 py-3 text-slate-400">{done ? '—' : currentSteps.join('、') || '—'}</td>
                    <td className="px-4 py-3 text-slate-400">{computeCaseProgress(c)}%</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${done ? 'text-emerald-400 bg-emerald-400/10' : 'text-amber-400 bg-amber-400/10'}`}>
                        {done ? '已結案' : '未結案'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
