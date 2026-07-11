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

const TODAY_STYLE: Record<string, string> = {
  overdue: 'text-red-400 bg-red-400/10 border border-red-400/30',
  current: 'text-amber-400 bg-amber-400/10 border border-amber-400/30',
  upcoming: 'text-slate-500 bg-slate-800 border border-slate-700',
  done: 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/30'
};
const TODAY_LABEL: Record<string, string> = {
  overdue: '逾期', current: '進行中', upcoming: '未開始', done: '已完成'
};

const PARALLEL_COLORS = ['#475569', '#10b981', '#3b82f6', '#f59e0b', '#a855f7', '#f43f5e'];
function parallelColor(order: number) { return PARALLEL_COLORS[order % PARALLEL_COLORS.length] ?? '#475569'; }

interface Seg { order: number; items: Milestone[] }
function buildSegments(subs: Milestone[]): Seg[] {
  const segs: Seg[] = [];
  let i = 0;
  while (i < subs.length) {
    const group = [subs[i]];
    while (i + 1 < subs.length && subs[i + 1].groupOrder === subs[i].groupOrder) { i++; group.push(subs[i]); }
    segs.push({ order: subs[i - group.length + 1]?.groupOrder ?? subs[i].groupOrder, items: group });
    i++;
  }
  return segs;
}

function markAllDone(m: Milestone): Milestone {
  if (isGroupMilestone(m)) return { ...m, subMilestones: m.subMilestones!.map(markAllDone) };
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

  function updateField(patch: Partial<Milestone>) { onChange({ ...milestone, ...patch }); }

  function handleSubChange(updated: Milestone) {
    onChange({ ...milestone, subMilestones: subList.map((s) => (s.id === updated.id ? updated : s)) });
  }

  // ── Leaf row content (used both standalone depth-0 and inside container body) ──
  function leafContent() {
    return (
      <>
        {/* Checklist */}
        {(milestone.checklistItems ?? []).length > 0 && (
          <div className="ml-10 px-3 pb-1.5 space-y-1">
            {milestone.checklistItems!.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-xs text-slate-400">
                <input type="checkbox" checked={item.done}
                  onChange={() => onChange({ ...milestone, checklistItems: milestone.checklistItems!.map((c) => c.id === item.id ? { ...c, done: !c.done } : c) })} />
                <input
                  className={`flex-1 bg-slate-800/50 rounded px-2 py-1 outline-none ${item.done ? 'line-through text-slate-600' : ''}`}
                  value={item.label}
                  onChange={(e) => onChange({ ...milestone, checklistItems: milestone.checklistItems!.map((c) => c.id === item.id ? { ...c, label: e.target.value } : c) })}
                  placeholder="checklist 項目"
                />
                <button onClick={() => onChange({ ...milestone, checklistItems: milestone.checklistItems!.filter((c) => c.id !== item.id) })}
                  className="text-slate-600 hover:text-red-400"><X size={13} /></button>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => onChange({ ...milestone, checklistItems: [...(milestone.checklistItems ?? []), { id: newId(), label: '', done: false }] })}
          className="text-xs text-slate-600 hover:text-primary-400 ml-10 px-3 pb-2 flex items-center gap-1"
        >
          <Plus size={11} /> 新增 checklist 項目
        </button>
      </>
    );
  }

  // ── Group container (depth 0, isGroup) ──
  if (isGroup && depth === 0) {
    const segs = buildSegments(subList);
    const accentColor = parallelColor(milestone.groupOrder);

    return (
      <div className="rounded-lg overflow-hidden border border-slate-700/60">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-800 group/hdr cursor-pointer select-none"
          onClick={() => setCollapsed((v) => !v)}>
          <button className="text-slate-400 hover:text-slate-200 shrink-0" onClick={(e) => { e.stopPropagation(); setCollapsed((v) => !v); }}>
            {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </button>
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: accentColor }} />
          <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 w-14 text-center font-medium ${TODAY_STYLE[todayStatus]}`}>
            {TODAY_LABEL[todayStatus]}
          </span>
          <input
            className="flex-1 min-w-0 font-semibold bg-transparent outline-none text-slate-100 text-sm cursor-text"
            value={milestone.name}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => updateField({ name: e.target.value })}
          />
          <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
            <span className="text-xs text-slate-500">{range.start ?? '—'} ~ {range.end ?? '—'}</span>
            {subList.length > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                </div>
                <span className="text-xs text-slate-500 w-8 text-right">{progressPct}%</span>
              </div>
            )}
            <button
              onClick={() => onChange(markAllDone(milestone))}
              className="text-xs px-2 py-1 rounded border border-emerald-800/50 bg-emerald-900/20 text-emerald-400 hover:bg-emerald-900/50 whitespace-nowrap opacity-0 group-hover/hdr:opacity-100 transition-opacity"
            >
              全數完成
            </button>
            <button onClick={() => onDelete(milestone.id)} className="text-slate-500 hover:text-red-400 p-0.5 opacity-0 group-hover/hdr:opacity-100 transition-opacity">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        {!collapsed && (
          <div className="bg-slate-900/60 divide-y divide-slate-800/60">
            {segs.map((seg) => {
              const isParallel = seg.items.length > 1;
              const color = parallelColor(seg.order);
              if (!isParallel) {
                return (
                  <MilestoneRow key={seg.items[0].id} milestone={seg.items[0]} depth={1}
                    onChange={handleSubChange} onEndDateChange={onEndDateChange}
                    onAddSubItem={onAddSubItem} onDelete={onDelete} />
                );
              }
              return (
                <div key={`pg-${seg.order}`}>
                  <div className="flex items-center gap-2 px-4 py-1.5">
                    <div className="flex-1 h-px" style={{ background: color, opacity: 0.3 }} />
                    <span className="text-xs whitespace-nowrap" style={{ color, opacity: 0.9 }}>⇉ 並行啟動</span>
                    <div className="flex-1 h-px" style={{ background: color, opacity: 0.3 }} />
                  </div>
                  {seg.items.map((sub) => (
                    <MilestoneRow key={sub.id} milestone={sub} depth={1}
                      onChange={handleSubChange} onEndDateChange={onEndDateChange}
                      onAddSubItem={onAddSubItem} onDelete={onDelete} />
                  ))}
                </div>
              );
            })}
            <div className="px-4 py-2">
              <button onClick={() => onAddSubItem(milestone.id)}
                className="text-xs text-slate-500 hover:text-primary-400 flex items-center gap-1">
                <Plus size={12} /> 新增子項目
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Leaf row (depth > 0 inside container, or standalone depth-0 leaf) ──
  const isStandalone = depth === 0;
  return (
    <div className={isStandalone ? 'rounded-lg border border-slate-800 bg-slate-900/60' : ''}>
      <div className={`flex items-center gap-2 py-2.5 px-3 group/row ${isStandalone ? '' : 'hover:bg-slate-800/30 transition-colors'}`}>
        <span className="w-4 shrink-0" />
        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 w-14 text-center font-medium ${TODAY_STYLE[todayStatus]}`}>
          {TODAY_LABEL[todayStatus]}
        </span>
        <input
          className="flex-1 min-w-0 bg-transparent outline-none text-sm text-slate-200"
          value={milestone.name}
          onChange={(e) => updateField({ name: e.target.value })}
        />
        <div className="flex items-center gap-2 shrink-0 text-xs text-slate-500 font-mono">
          <label className="flex items-center gap-1 whitespace-nowrap">
            開始
            <input type="date" className="bg-slate-800 rounded px-1.5 py-0.5 text-xs outline-none"
              value={milestone.plannedStartDate ?? ''} onChange={(e) => updateField({ plannedStartDate: e.target.value })} />
          </label>
          <label className="flex items-center gap-1 whitespace-nowrap">
            結束
            <input type="date" className="bg-slate-800 rounded px-1.5 py-0.5 text-xs outline-none"
              value={milestone.plannedDate ?? ''} onChange={(e) => onEndDateChange(milestone.id, e.target.value)}
              title="改結束時間會反推工期，後面項目跟著順延" />
          </label>
          <select className="bg-slate-800 rounded px-1.5 py-0.5 text-xs shrink-0 outline-none"
            value={milestone.status ?? '待辦'} onChange={(e) => updateField({ status: e.target.value as Milestone['status'] })}>
            <option value="待辦">待辦</option>
            <option value="進行中">進行中</option>
            <option value="已完成">已完成</option>
          </select>
          <input className="bg-slate-800 rounded px-1.5 py-0.5 text-xs w-16 shrink-0 outline-none"
            placeholder="負責人" value={milestone.owner ?? ''} onChange={(e) => updateField({ owner: e.target.value })} />
          <button onClick={() => onDelete(milestone.id)}
            className="opacity-0 group-hover/row:opacity-100 transition-opacity text-slate-600 hover:text-red-400 p-0.5">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {leafContent()}
      {depth === 0 && (
        <button onClick={() => onAddSubItem(milestone.id)}
          className="text-xs text-slate-500 hover:text-primary-400 px-3 pb-2 flex items-center gap-1">
          <Plus size={12} /> 新增子項目
        </button>
      )}
    </div>
  );
}
