import { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Link2, Plus, Trash2, X } from 'lucide-react';
import type { TemplateStep } from '../../types';
import { newId } from '../../services/storage';

interface StepEditorProps {
  steps: TemplateStep[];
  onChange: (steps: TemplateStep[]) => void;
  depth?: number;
}

function updateStepAt(steps: TemplateStep[], id: string, patch: Partial<TemplateStep>): TemplateStep[] {
  return steps.map((s) => (s.id === id ? { ...s, ...patch } : s));
}

function removeStepAt(steps: TemplateStep[], id: string): TemplateStep[] {
  return steps.filter((s) => s.id !== id);
}

function moveStep(steps: TemplateStep[], idx: number, dir: -1 | 1): TemplateStep[] {
  const to = idx + dir;
  if (to < 0 || to >= steps.length) return steps;
  const next = [...steps];
  [next[idx], next[to]] = [next[to], next[idx]];
  return next;
}

const PARALLEL_COLORS = ['#475569', '#10b981', '#3b82f6', '#f59e0b', '#a855f7', '#f43f5e'];
function parallelColor(groupOrder: number): string {
  return PARALLEL_COLORS[groupOrder % PARALLEL_COLORS.length] ?? '#475569';
}

interface Segment {
  order: number;
  items: Array<{ step: TemplateStep; idx: number }>;
}

function buildSegments(steps: TemplateStep[]): Segment[] {
  const segs: Segment[] = [];
  let i = 0;
  while (i < steps.length) {
    const s = steps[i];
    const group: Array<{ step: TemplateStep; idx: number }> = [{ step: s, idx: i }];
    while (i + 1 < steps.length && steps[i + 1].groupOrder === s.groupOrder) {
      i++;
      group.push({ step: steps[i], idx: i });
    }
    segs.push({ order: s.groupOrder, items: group });
    i++;
  }
  return segs;
}

export default function StepEditor({ steps, onChange, depth = 0 }: StepEditorProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  function toggleCollapsed(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function addGroupStep() {
    onChange([
      ...steps,
      {
        id: newId(),
        name: '新群組',
        groupOrder: (steps[steps.length - 1]?.groupOrder ?? 0) + 1,
        subSteps: [{ id: newId(), name: '新子步驟', groupOrder: 1 }]
      }
    ]);
  }

  function addTopLeaf() {
    onChange([...steps, { id: newId(), name: '新步驟', groupOrder: (steps[steps.length - 1]?.groupOrder ?? 0) + 1 }]);
  }

  function addSubStep(parent: TemplateStep) {
    const subSteps = [
      ...(parent.subSteps ?? []),
      { id: newId(), name: '新子步驟', groupOrder: (parent.subSteps?.length ?? 0) + 1 }
    ];
    onChange(updateStepAt(steps, parent.id, { subSteps, checklistItems: undefined, durationDays: undefined }));
  }

  function handleGroupOrderChange(s: TemplateStep, newOrder: number, subSteps: TemplateStep[], onSubChange: (s: TemplateStep[]) => void) {
    const updated = updateStepAt(subSteps, s.id, { groupOrder: newOrder });
    onSubChange([...updated].sort((a, b) => a.groupOrder - b.groupOrder));
  }

  // ─── Leaf row (inside a group container) ───
  function renderLeaf(
    s: TemplateStep,
    idx: number,
    siblings: TemplateStep[],
    onSibChange: (next: TemplateStep[]) => void
  ) {
    return (
      <div key={s.id}>
        {/* Step row */}
        <div className="flex items-center gap-1.5 px-3 py-2.5 group/row hover:bg-slate-800/30 transition-colors">
          {/* Move buttons */}
          <div className="flex flex-col shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity">
            <button
              onClick={() => onSibChange(moveStep(siblings, idx, -1))}
              disabled={idx === 0}
              className="text-slate-600 hover:text-slate-300 disabled:opacity-20 p-0.5"
            >
              <ArrowUp size={11} />
            </button>
            <button
              onClick={() => onSibChange(moveStep(siblings, idx, 1))}
              disabled={idx === siblings.length - 1}
              className="text-slate-600 hover:text-slate-300 disabled:opacity-20 p-0.5"
            >
              <ArrowDown size={11} />
            </button>
          </div>

          {/* Name */}
          <input
            className="flex-1 min-w-0 bg-transparent outline-none text-sm text-slate-200 placeholder:text-slate-600"
            value={s.name}
            onChange={(e) => onSibChange(updateStepAt(siblings, s.id, { name: e.target.value }))}
            placeholder="步驟名稱"
          />

          {/* Right badges */}
          <div className="flex items-center gap-2 shrink-0 text-xs text-slate-500 font-mono">
            <span className="flex items-center gap-0.5 whitespace-nowrap">
              [<Link2 size={10} className="inline shrink-0" />群組&thinsp;
              <input
                type="number"
                className="w-5 bg-transparent outline-none text-slate-400 [appearance:textfield] text-xs"
                value={s.groupOrder}
                onChange={(e) => handleGroupOrderChange(s, Number(e.target.value), siblings, onSibChange)}
              />]
            </span>
            <span className="flex items-center gap-0.5 whitespace-nowrap">
              [工期&thinsp;
              <input
                type="number"
                className="w-6 bg-transparent outline-none text-slate-400 [appearance:textfield] text-xs"
                value={s.durationDays ?? ''}
                placeholder="?"
                onChange={(e) =>
                  onSibChange(updateStepAt(siblings, s.id, { durationDays: e.target.value === '' ? undefined : Number(e.target.value) }))
                }
              />
              天]
            </span>
            <button
              onClick={() => onSibChange(removeStepAt(siblings, s.id))}
              className="opacity-0 group-hover/row:opacity-100 transition-opacity text-slate-600 hover:text-red-400 p-0.5"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Checklist (indented) */}
        {(s.checklistItems ?? []).length > 0 && (
          <div className="ml-12 px-3 pb-2 space-y-1">
            {(s.checklistItems ?? []).map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                <span>☐</span>
                <input
                  className="flex-1 bg-slate-800/50 rounded px-2 py-1 outline-none"
                  value={item}
                  onChange={(e) => {
                    const items = [...(s.checklistItems ?? [])];
                    items[i] = e.target.value;
                    onSibChange(updateStepAt(siblings, s.id, { checklistItems: items }));
                  }}
                  placeholder="checklist 項目"
                />
                <button
                  onClick={() => {
                    const items = (s.checklistItems ?? []).filter((_, j) => j !== i);
                    onSibChange(updateStepAt(siblings, s.id, { checklistItems: items }));
                  }}
                  className="text-slate-600 hover:text-red-400"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => {
            const items = [...(s.checklistItems ?? []), ''];
            onSibChange(updateStepAt(siblings, s.id, { checklistItems: items }));
          }}
          className="text-xs text-slate-600 hover:text-primary-400 ml-12 px-3 pb-2 flex items-center gap-1"
        >
          <Plus size={11} /> 新增 checklist 項目
        </button>
      </div>
    );
  }

  // ─── Group container ───
  function renderGroup(s: TemplateStep, idx: number) {
    const isCollapsed = collapsed.has(s.id);
    const subSteps = s.subSteps ?? [];
    const totalDays = subSteps.reduce((acc, sub) => acc + (sub.durationDays ?? 0), 0);
    const subSegs = buildSegments(subSteps);
    const accentColor = parallelColor(s.groupOrder);

    function onSubChange(next: TemplateStep[]) {
      onChange(updateStepAt(steps, s.id, { subSteps: next }));
    }

    return (
      <div key={s.id} className="rounded-lg overflow-hidden border border-slate-700/60">
        {/* Header */}
        <div
          className="flex items-center gap-2 px-3 py-2.5 bg-slate-800 cursor-pointer select-none group/hdr"
          onClick={() => toggleCollapsed(s.id)}
        >
          <button className="text-slate-400 hover:text-slate-200 shrink-0" onClick={(e) => { e.stopPropagation(); toggleCollapsed(s.id); }}>
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </button>
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: accentColor }} />
          <input
            className="flex-1 font-semibold bg-transparent outline-none text-slate-100 cursor-text text-sm"
            value={s.name}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onChange(updateStepAt(steps, s.id, { name: e.target.value }))}
            placeholder="群組名稱"
          />
          {totalDays > 0 && (
            <span className="text-xs text-slate-400 bg-slate-700 rounded px-2 py-0.5 shrink-0">共 {totalDays} 天</span>
          )}
          {/* Move + Delete (hover) */}
          <div className="flex items-center gap-1 opacity-0 group-hover/hdr:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => onChange(moveStep(steps, idx, -1))} disabled={idx === 0} className="text-slate-500 hover:text-slate-200 disabled:opacity-20 p-0.5">
              <ArrowUp size={12} />
            </button>
            <button onClick={() => onChange(moveStep(steps, idx, 1))} disabled={idx === steps.length - 1} className="text-slate-500 hover:text-slate-200 disabled:opacity-20 p-0.5">
              <ArrowDown size={12} />
            </button>
            <button onClick={() => onChange(removeStepAt(steps, s.id))} className="text-slate-500 hover:text-red-400 p-0.5">
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Body */}
        {!isCollapsed && (
          <div className="bg-slate-900/60 divide-y divide-slate-800/60">
            {subSegs.map((seg) => {
              const isParallel = seg.items.length > 1;
              const color = parallelColor(seg.order);

              if (!isParallel) {
                const { step: sub, idx: subIdx } = seg.items[0];
                return renderLeaf(sub, subIdx, subSteps, onSubChange);
              }

              // Parallel group separator
              return (
                <div key={`pg-${seg.order}`}>
                  <div className="flex items-center gap-2 px-4 py-1.5">
                    <div className="flex-1 h-px" style={{ background: color, opacity: 0.3 }} />
                    <span className="text-xs whitespace-nowrap" style={{ color, opacity: 0.9 }}>⇉ 並行啟動</span>
                    <div className="flex-1 h-px" style={{ background: color, opacity: 0.3 }} />
                  </div>
                  {seg.items.map(({ step: sub, idx: subIdx }) => renderLeaf(sub, subIdx, subSteps, onSubChange))}
                  <div className="flex items-center gap-2 px-4 py-1">
                    <div className="flex-1 h-px" style={{ background: color, opacity: 0.15 }} />
                  </div>
                </div>
              );
            })}

            {/* Add sub-step */}
            <div className="px-3 py-2">
              <button
                onClick={() => addSubStep(s)}
                className="text-xs text-slate-500 hover:text-primary-400 flex items-center gap-1"
              >
                <Plus size={12} /> 新增步驟
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Top-level render ───
  const topSegs = buildSegments(steps);

  return (
    <div className="space-y-2">
      {topSegs.map((seg) => {
        // Top-level usually each group has unique order; single item = render as group or leaf
        if (seg.items.length === 1) {
          const { step: s, idx } = seg.items[0];
          if (s.subSteps && s.subSteps.length > 0) return renderGroup(s, idx);
          // Top-level leaf (rare)
          return renderLeaf(s, idx, steps, onChange);
        }
        // Top-level parallel (very rare but supported)
        const color = parallelColor(seg.order);
        return (
          <div key={`tpg-${seg.order}`} className="relative pl-3">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full" style={{ background: color, opacity: 0.6 }} />
            <div className="flex items-center gap-2 mb-1.5 text-xs" style={{ color }}>
              <div className="w-3 h-px" style={{ background: color, opacity: 0.6 }} />
              ⇉ 並行啟動
            </div>
            <div className="space-y-2">
              {seg.items.map(({ step: s, idx }) =>
                s.subSteps && s.subSteps.length > 0 ? renderGroup(s, idx) : renderLeaf(s, idx, steps, onChange)
              )}
            </div>
          </div>
        );
      })}

      <div className="flex items-center gap-4 pt-1">
        {depth === 0 && (
          <button onClick={addGroupStep} className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
            <Plus size={14} /> 新增群組
          </button>
        )}
        <button onClick={addTopLeaf} className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
          <Plus size={14} /> 新增步驟
        </button>
      </div>
    </div>
  );
}
