import { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Plus, Trash2, X } from 'lucide-react';
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
function parallelBorderColor(groupOrder: number): string {
  return PARALLEL_COLORS[groupOrder % PARALLEL_COLORS.length] ?? '#475569';
}

// Group consecutive steps with same groupOrder for parallel visualization
interface ParallelSegment {
  order: number;
  items: Array<{ step: TemplateStep; idx: number }>;
}

function buildSegments(steps: TemplateStep[]): ParallelSegment[] {
  const segments: ParallelSegment[] = [];
  let i = 0;
  while (i < steps.length) {
    const s = steps[i];
    const group: Array<{ step: TemplateStep; idx: number }> = [{ step: s, idx: i }];
    while (i + 1 < steps.length && steps[i + 1].groupOrder === s.groupOrder) {
      i++;
      group.push({ step: steps[i], idx: i });
    }
    segments.push({ order: s.groupOrder, items: group });
    i++;
  }
  return segments;
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

  function addStep() {
    onChange([...steps, { id: newId(), name: '新步驟', groupOrder: (steps[steps.length - 1]?.groupOrder ?? 0) + 1 }]);
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

  function addChecklistItem(step: TemplateStep) {
    onChange(updateStepAt(steps, step.id, { checklistItems: [...(step.checklistItems ?? []), ''] }));
  }

  function updateChecklistItem(step: TemplateStep, index: number, value: string) {
    const items = [...(step.checklistItems ?? [])];
    items[index] = value;
    onChange(updateStepAt(steps, step.id, { checklistItems: items }));
  }

  function removeChecklistItem(step: TemplateStep, index: number) {
    onChange(updateStepAt(steps, step.id, { checklistItems: (step.checklistItems ?? []).filter((_, i) => i !== index) }));
  }

  function addSubStep(step: TemplateStep) {
    const subSteps = [...(step.subSteps ?? []), { id: newId(), name: '新子步驟', groupOrder: (step.subSteps?.length ?? 0) + 1 }];
    onChange(updateStepAt(steps, step.id, { subSteps, checklistItems: undefined, durationDays: undefined }));
  }

  function renderStep(s: TemplateStep, idx: number) {
    const isGroup = !!s.subSteps && s.subSteps.length > 0;
    const isCollapsed = collapsed.has(s.id);
    const totalDays = isGroup ? (s.subSteps ?? []).reduce((acc, sub) => acc + (sub.durationDays ?? 0), 0) : null;
    const accentColor = parallelBorderColor(s.groupOrder);

    return (
      <div
        key={s.id}
        className="rounded-lg border border-slate-800 p-3 bg-slate-900/60 group/row"
        style={{ borderLeft: `3px solid ${accentColor}` }}
      >
        {/* Header row */}
        <div className="flex items-center gap-1.5">
          {/* Move up/down */}
          <div className="flex flex-col shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity">
            <button
              onClick={() => onChange(moveStep(steps, idx, -1))}
              disabled={idx === 0}
              className="text-slate-500 hover:text-slate-200 disabled:opacity-20 p-0.5"
              title="上移"
            >
              <ArrowUp size={11} />
            </button>
            <button
              onClick={() => onChange(moveStep(steps, idx, 1))}
              disabled={idx === steps.length - 1}
              className="text-slate-500 hover:text-slate-200 disabled:opacity-20 p-0.5"
              title="下移"
            >
              <ArrowDown size={11} />
            </button>
          </div>

          {isGroup ? (
            <button onClick={() => toggleCollapsed(s.id)} className="text-slate-400 hover:text-slate-200 shrink-0">
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </button>
          ) : (
            <span className="w-4 shrink-0" />
          )}

          <input
            className="flex-1 min-w-0 bg-slate-800 rounded px-2 py-1 text-sm"
            value={s.name}
            onChange={(e) => onChange(updateStepAt(steps, s.id, { name: e.target.value }))}
            placeholder="步驟名稱"
          />

          {/* Right-aligned controls */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <label className="text-xs text-slate-400 flex items-center gap-1 whitespace-nowrap">
              並行群組
              <input
                type="number"
                className="w-12 bg-slate-800 rounded px-2 py-1 text-sm"
                value={s.groupOrder}
                onChange={(e) => {
                  const newOrder = Number(e.target.value);
                  // Sort by new groupOrder so same-order items become consecutive → auto-group
                  const updated = updateStepAt(steps, s.id, { groupOrder: newOrder });
                  onChange([...updated].sort((a, b) => a.groupOrder - b.groupOrder));
                }}
              />
            </label>
            {!isGroup && (
              <label className="text-xs text-slate-400 flex items-center gap-1 whitespace-nowrap">
                工期(天)
                <input
                  type="number"
                  className="w-14 bg-slate-800 rounded px-2 py-1 text-sm"
                  value={s.durationDays ?? ''}
                  onChange={(e) =>
                    onChange(updateStepAt(steps, s.id, { durationDays: e.target.value === '' ? undefined : Number(e.target.value) }))
                  }
                />
              </label>
            )}
            {isGroup && totalDays !== null && totalDays > 0 && (
              <span className="text-xs text-slate-500 whitespace-nowrap">共 {totalDays} 天</span>
            )}
            <button
              onClick={() => onChange(removeStepAt(steps, s.id))}
              className="text-slate-500 hover:text-red-400 p-1 opacity-0 group-hover/row:opacity-100 transition-opacity"
              title="刪除步驟"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Body (collapsible for groups) */}
        {!isCollapsed && (
          <>
            {isGroup && (
              <p className="text-xs text-slate-600 mt-2 ml-5">分組容器，狀態由子步驟推算。</p>
            )}

            {!isGroup && (
              <div className="mt-2 space-y-1">
                {(s.checklistItems ?? []).map((item, i) => (
                  <div key={i} className="flex items-center gap-2 ml-12">
                    <span className="text-slate-500 text-xs">☐</span>
                    <input
                      className="flex-1 bg-slate-800/60 rounded px-2 py-1 text-xs"
                      value={item}
                      onChange={(e) => updateChecklistItem(s, i, e.target.value)}
                      placeholder="checklist 項目"
                    />
                    <button onClick={() => removeChecklistItem(s, i)} className="text-slate-500 hover:text-red-400">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addChecklistItem(s)}
                  className="text-xs text-primary-400 hover:text-primary-300 ml-12 flex items-center gap-1"
                >
                  <Plus size={12} /> 新增 checklist 項目
                </button>
              </div>
            )}

            {s.subSteps && s.subSteps.length > 0 && (
              <div className="mt-3 ml-5 pl-3 border-l-2 border-slate-700/40">
                <StepEditor
                  steps={s.subSteps}
                  onChange={(subSteps) => onChange(updateStepAt(steps, s.id, { subSteps }))}
                  depth={depth + 1}
                />
              </div>
            )}

            {depth === 0 && !isGroup && (
              <button
                onClick={() => addSubStep(s)}
                className="text-xs text-slate-500 hover:text-primary-400 mt-2 ml-5 flex items-center gap-1"
              >
                <Plus size={12} /> 新增子步驟
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  const segments = buildSegments(steps);

  return (
    <div className="space-y-2">
      {segments.map((seg) => {
        const isParallel = seg.items.length > 1;
        const accentColor = parallelBorderColor(seg.order);

        if (!isParallel) {
          const { step, idx } = seg.items[0];
          return renderStep(step, idx);
        }

        // Parallel group wrapper with bracket + label
        return (
          <div key={`pg-${seg.order}`} className="relative pl-3">
            {/* Left bracket line */}
            <div
              className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
              style={{ background: accentColor, opacity: 0.6 }}
            />
            {/* Top connector + label */}
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-3 h-px" style={{ background: accentColor, opacity: 0.6 }} />
              <span className="text-xs px-1.5 py-0.5 rounded-full border whitespace-nowrap" style={{ color: accentColor, borderColor: accentColor + '60', background: accentColor + '18' }}>
                ⇉ 並行啟動
              </span>
            </div>
            <div className="space-y-2">
              {seg.items.map(({ step, idx }) => renderStep(step, idx))}
            </div>
            {/* Bottom connector */}
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-3 h-px" style={{ background: accentColor, opacity: 0.6 }} />
            </div>
          </div>
        );
      })}

      <div className="flex items-center gap-4 pt-1">
        <button onClick={addStep} className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
          <Plus size={14} /> 新增步驟
        </button>
        {depth === 0 && (
          <button onClick={addGroupStep} className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
            <Plus size={14} /> 新增群組
          </button>
        )}
      </div>
    </div>
  );
}
