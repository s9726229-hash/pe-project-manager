import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, X } from 'lucide-react';
import type { Milestone } from '../../types';
import { getMilestoneDateRange, getMilestoneTodayStatus, isGroupMilestone } from '../../services/milestoneUtils';
import { newId } from '../../services/storage';

interface MilestoneRowProps {
  milestone: Milestone;
  onChange: (milestone: Milestone) => void;
  onEndDateChange: (leafId: string, newValue: string) => void;
  onAddSubItem: (parentId: string) => void;
  onDelete: (id: string) => void;
  depth?: number;
}

const TODAY_STATUS_STYLE: Record<string, string> = {
  overdue: 'text-red-400 bg-red-400/10 border border-red-400/30',
  current: 'text-amber-400 bg-amber-400/10 border border-amber-400/30',
  upcoming: 'text-slate-500 bg-slate-800 border border-slate-700',
  done: 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/30'
};

const TODAY_STATUS_LABEL: Record<string, string> = {
  overdue: '逾期',
  current: '進行中',
  upcoming: '未開始',
  done: '已完成'
};

const PARALLEL_COLORS = ['#475569', '#10b981', '#3b82f6', '#f59e0b', '#a855f7', '#f43f5e'];
function parallelColor(groupOrder: number): string {
  return PARALLEL_COLORS[groupOrder % PARALLEL_COLORS.length] ?? '#475569';
}

interface ParallelSegment {
  order: number;
  items: Milestone[];
}

function buildSegments(subs: Milestone[]): ParallelSegment[] {
  const segments: ParallelSegment[] = [];
  let i = 0;
  while (i < subs.length) {
    const s = subs[i];
    const group: Milestone[] = [s];
    while (i + 1 < subs.length && subs[i + 1].groupOrder === s.groupOrder) {
      i++;
      group.push(subs[i]);
    }
    segments.push({ order: s.groupOrder, items: group });
    i++;
  }
  return segments;
}

function markAllDone(m: Milestone): Milestone {
  if (isGroupMilestone(m)) {
    return { ...m, subMilestones: m.subMilestones!.map(markAllDone) };
  }
  return { ...m, status: '已完成' };
}

export default function MilestoneRow({ milestone, onChange, onEndDateChange, onAddSubItem, onDelete, depth = 0 }: MilestoneRowProps) {
  const [collapsed, setCollapsed] = useState(false);

  const isGroup = isGroupMilestone(milestone);
  const range = getMilestoneDateRange(milestone);
  const todayStatus = getMilestoneTodayStatus(milestone);

  const subList = milestone.subMilestones ?? [];
  const doneCount = subList.filter((s) => s.status === '已完成').length;
  const progressPct = subList.length > 0 ? Math.round((doneCount / subList.length) * 100) : 0;

  function toggleChecklistItem(itemId: string) {
    const checklistItems = (milestone.checklistItems ?? []).map((c) => (c.id === itemId ? { ...c, done: !c.done } : c));
    onChange({ ...milestone, checklistItems });
  }

  function updateChecklistLabel(itemId: string, label: string) {
    const checklistItems = (milestone.checklistItems ?? []).map((c) => (c.id === itemId ? { ...c, label } : c));
    onChange({ ...milestone, checklistItems });
  }

  function removeChecklistItem(itemId: string) {
    const checklistItems = (milestone.checklistItems ?? []).filter((c) => c.id !== itemId);
    onChange({ ...milestone, checklistItems });
  }

  function addChecklistItem() {
    const checklistItems = [...(milestone.checklistItems ?? []), { id: newId(), label: '', done: false }];
    onChange({ ...milestone, checklistItems });
  }

  function updateField(patch: Partial<Milestone>) {
    onChange({ ...milestone, ...patch });
  }

  function handleSubChange(updated: Milestone) {
    const subMilestones = milestone.subMilestones!.map((s) => (s.id === updated.id ? updated : s));
    onChange({ ...milestone, subMilestones });
  }

  const segments = isGroup ? buildSegments(subList) : [];

  return (
    <div className={depth > 0 ? 'ml-6' : ''}>
      <div className={`flex items-center gap-2 py-2 px-3 rounded-lg group/row ${depth === 0 ? 'bg-slate-900/60 border border-slate-800' : ''}`}>

        {/* Collapse toggle for groups */}
        {isGroup ? (
          <button onClick={() => setCollapsed((v) => !v)} className="text-slate-400 hover:text-slate-200 shrink-0">
            {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        {/* Status capsule */}
        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 w-14 text-center font-medium ${TODAY_STATUS_STYLE[todayStatus]}`}>
          {TODAY_STATUS_LABEL[todayStatus]}
        </span>

        {/* Name */}
        <input
          className={`flex-1 min-w-0 bg-transparent outline-none ${depth === 0 ? 'font-medium' : 'text-sm'}`}
          value={milestone.name}
          onChange={(e) => updateField({ name: e.target.value })}
        />

        {/* Right-side controls */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {!isGroup ? (
            <>
              <label className="text-xs text-slate-500 flex items-center gap-1">
                開始
                <input
                  type="date"
                  className="bg-slate-800 rounded px-2 py-1 text-xs"
                  value={milestone.plannedStartDate ?? ''}
                  onChange={(e) => updateField({ plannedStartDate: e.target.value })}
                />
              </label>
              <label className="text-xs text-slate-500 flex items-center gap-1">
                結束
                <input
                  type="date"
                  className="bg-slate-800 rounded px-2 py-1 text-xs"
                  value={milestone.plannedDate ?? ''}
                  onChange={(e) => onEndDateChange(milestone.id, e.target.value)}
                  title="改結束時間會反推工期，並讓後面所有項目跟著順延/提前"
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
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">{range.start ?? '—'} ~ {range.end ?? '—'}</span>
              {subList.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                  </div>
                  <span className="text-xs text-slate-500 w-8 text-right">{progressPct}%</span>
                </div>
              )}
              {/* 全數完成 */}
              <button
                onClick={() => onChange(markAllDone(milestone))}
                className="text-xs px-2 py-1 rounded border border-emerald-800/50 bg-emerald-900/20 text-emerald-400 hover:bg-emerald-900/50 whitespace-nowrap opacity-0 group-hover/row:opacity-100 transition-opacity"
                title="把所有子項目都標記為已完成"
              >
                全數完成
              </button>
            </div>
          )}

          <button
            onClick={() => onDelete(milestone.id)}
            className="text-slate-500 hover:text-red-400 p-1 opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0"
            title="刪除這個項目"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Checklist (leaf only) */}
      {!isGroup && (
        <div className="ml-16 mt-1 mb-2 space-y-1">
          {(milestone.checklistItems ?? []).map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-xs text-slate-400">
              <input type="checkbox" checked={item.done} onChange={() => toggleChecklistItem(item.id)} />
              <input
                className={`flex-1 bg-slate-800 rounded px-2 py-1 ${item.done ? 'line-through text-slate-600' : ''}`}
                value={item.label}
                onChange={(e) => updateChecklistLabel(item.id, e.target.value)}
                placeholder="checklist 項目"
              />
              <button onClick={() => removeChecklistItem(item.id)} className="text-slate-500 hover:text-red-400">
                <X size={13} />
              </button>
            </div>
          ))}
          <button onClick={addChecklistItem} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
            <Plus size={12} /> 新增 checklist 項目
          </button>
        </div>
      )}

      {/* Sub-milestones with parallel bracket visualization */}
      {isGroup && !collapsed && (
        <div className="mt-1 space-y-1.5">
          {segments.map((seg) => {
            const isParallel = seg.items.length > 1;
            const color = parallelColor(seg.order);

            if (!isParallel) {
              const sub = seg.items[0];
              return (
                <MilestoneRow
                  key={sub.id}
                  milestone={sub}
                  depth={depth + 1}
                  onEndDateChange={onEndDateChange}
                  onAddSubItem={onAddSubItem}
                  onDelete={onDelete}
                  onChange={handleSubChange}
                />
              );
            }

            // Parallel group wrapper
            return (
              <div key={`pg-${seg.order}`} className="relative pl-3 ml-6">
                {/* Left bracket line */}
                <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full" style={{ background: color, opacity: 0.6 }} />
                {/* Label */}
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-px" style={{ background: color, opacity: 0.6 }} />
                  <span className="text-xs px-1.5 py-0.5 rounded-full border whitespace-nowrap" style={{ color, borderColor: color + '60', background: color + '18' }}>
                    ⇉ 並行啟動
                  </span>
                </div>
                <div className="space-y-1">
                  {seg.items.map((sub) => (
                    <MilestoneRow
                      key={sub.id}
                      milestone={sub}
                      depth={depth + 1}
                      onEndDateChange={onEndDateChange}
                      onAddSubItem={onAddSubItem}
                      onDelete={onDelete}
                      onChange={handleSubChange}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-3 h-px" style={{ background: color, opacity: 0.6 }} />
                </div>
              </div>
            );
          })}

          <button
            onClick={() => onAddSubItem(milestone.id)}
            className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 ml-6"
          >
            <Plus size={12} /> 新增子項目
          </button>
        </div>
      )}

      {!isGroup && depth === 0 && (
        <button
          onClick={() => onAddSubItem(milestone.id)}
          className="text-xs text-slate-500 hover:text-primary-400 mt-1 flex items-center gap-1"
        >
          <Plus size={12} /> 新增子項目
        </button>
      )}
    </div>
  );
}
