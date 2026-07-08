import type { Milestone } from '../../types';
import { getMilestoneDateRange, getMilestoneTodayStatus, isGroupMilestone } from '../../services/milestoneUtils';

interface MilestoneRowProps {
  milestone: Milestone;
  onChange: (milestone: Milestone) => void;
  depth?: number;
}

const STATUS_STYLE: Record<string, string> = {
  overdue: 'text-red-400 bg-red-400/10',
  current: 'text-amber-400 bg-amber-400/10',
  upcoming: 'text-slate-500',
  done: 'text-emerald-400'
};

const STATUS_LABEL: Record<string, string> = {
  overdue: '逾期',
  current: '進行中',
  upcoming: '未開始',
  done: '已完成'
};

export default function MilestoneRow({ milestone, onChange, depth = 0 }: MilestoneRowProps) {
  const isGroup = isGroupMilestone(milestone);
  const range = getMilestoneDateRange(milestone);
  const todayStatus = getMilestoneTodayStatus(milestone);

  function toggleChecklistItem(itemId: string) {
    const checklistItems = (milestone.checklistItems ?? []).map((c) => (c.id === itemId ? { ...c, done: !c.done } : c));
    onChange({ ...milestone, checklistItems });
  }

  function updateField(patch: Partial<Milestone>) {
    onChange({ ...milestone, ...patch });
  }

  return (
    <div className={depth > 0 ? 'ml-6' : ''}>
      <div className={`flex items-center gap-2 flex-wrap py-2 px-3 rounded-lg ${depth === 0 ? 'bg-slate-900/60 border border-slate-800' : ''}`}>
        <span className={`text-xs px-2 py-0.5 rounded shrink-0 w-14 text-center ${STATUS_STYLE[todayStatus]}`}>
          {STATUS_LABEL[todayStatus]}
        </span>
        <input
          className={`flex-1 min-w-[8rem] bg-transparent outline-none ${depth === 0 ? 'font-medium' : 'text-sm'}`}
          value={milestone.name}
          onChange={(e) => updateField({ name: e.target.value })}
        />

        {!isGroup ? (
          <>
            <label className="text-xs text-slate-500 flex items-center gap-1 shrink-0">
              開始
              <input
                type="date"
                className="bg-slate-800 rounded px-2 py-1 text-xs"
                value={milestone.plannedStartDate ?? ''}
                onChange={(e) => updateField({ plannedStartDate: e.target.value })}
              />
            </label>
            <label className="text-xs text-slate-500 flex items-center gap-1 shrink-0">
              結束
              <input
                type="date"
                className="bg-slate-800 rounded px-2 py-1 text-xs"
                value={milestone.plannedDate ?? ''}
                onChange={(e) => updateField({ plannedDate: e.target.value })}
              />
            </label>
            <select
              className="bg-slate-800 rounded px-2 py-1 text-xs shrink-0"
              value={milestone.status ?? '待辦'}
              onChange={(e) => updateField({ status: e.target.value as Milestone['status'] })}
            >
              <option value="待辦">待辦</option>
              <option value="進行中">進行中</option>
              <option value="已完成">已完成</option>
            </select>
            <input
              className="bg-slate-800 rounded px-2 py-1 text-xs w-20 shrink-0"
              placeholder="負責人"
              value={milestone.owner ?? ''}
              onChange={(e) => updateField({ owner: e.target.value })}
            />
          </>
        ) : (
          <span className="text-xs text-slate-500 shrink-0 w-40 text-right">
            {range.start ?? '—'} ~ {range.end ?? '—'}
          </span>
        )}
      </div>

      {!isGroup && milestone.checklistItems && milestone.checklistItems.length > 0 && (
        <div className="ml-16 mt-1 mb-2 space-y-1">
          {milestone.checklistItems.map((item) => (
            <label key={item.id} className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={item.done} onChange={() => toggleChecklistItem(item.id)} />
              <span className={item.done ? 'line-through text-slate-600' : ''}>{item.label}</span>
            </label>
          ))}
        </div>
      )}

      {isGroup && (
        <div className="mt-1 space-y-1">
          {milestone.subMilestones!.map((sub) => (
            <MilestoneRow
              key={sub.id}
              milestone={sub}
              depth={depth + 1}
              onChange={(updated) => {
                const subMilestones = milestone.subMilestones!.map((s) => (s.id === updated.id ? updated : s));
                onChange({ ...milestone, subMilestones });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
