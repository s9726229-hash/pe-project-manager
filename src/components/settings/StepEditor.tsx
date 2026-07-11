import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, X } from 'lucide-react';
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

// 並行群組顏色，0 = 無群組 (灰)，1~5 循環
const PARALLEL_COLORS = ['#475569', '#10b981', '#3b82f6', '#f59e0b', '#a855f7', '#f43f5e'];
function parallelBorderColor(groupOrder: number): string {
  return PARALLEL_COLORS[groupOrder % PARALLEL_COLORS.length] ?? '#475569';
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
    onChange([...steps, { id: newId(), name: '新步驟', groupOrder: steps.length + 1 }]);
  }

  function addGroupStep() {
    onChange([
      ...steps,
      {
        id: newId(),
        name: '新群組',
        groupOrder: steps.length + 1,
        subSteps: [{ id: newId(), name: '新子步驟', groupOrder: 1 }]
      }
    ]);
  }

  function addChecklistItem(step: TemplateStep) {
    const items = [...(step.checklistItems ?? []), ''];
    onChange(updateStepAt(steps, step.id, { checklistItems: items }));
  }

  function updateChecklistItem(step: TemplateStep, index: number, value: string) {
    const items = [...(step.checklistItems ?? [])];
    items[index] = value;
    onChange(updateStepAt(steps, step.id, { checklistItems: items }));
  }

  function removeChecklistItem(step: TemplateStep, index: number) {
    const items = (step.checklistItems ?? []).filter((_, i) => i !== index);
    onChange(updateStepAt(steps, step.id, { checklistItems: items }));
  }

  function addSubStep(step: TemplateStep) {
    const subSteps = [...(step.subSteps ?? []), { id: newId(), name: '新子步驟', groupOrder: (step.subSteps?.length ?? 0) + 1 }];
    onChange(updateStepAt(steps, step.id, { subSteps, checklistItems: undefined, durationDays: undefined }));
  }

  return (
    <div className="space-y-2">
      {steps.map((s) => {
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
            <div className="flex items-center gap-2">
              {isGroup ? (
                <button
                  onClick={() => toggleCollapsed(s.id)}
                  className="text-slate-400 hover:text-slate-200 shrink-0"
                >
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
                    onChange={(e) => onChange(updateStepAt(steps, s.id, { groupOrder: Number(e.target.value) }))}
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
                  <p className="text-xs text-slate-600 mt-2 ml-5">
                    分組容器，狀態由子步驟推算。
                  </p>
                )}

                {!isGroup && (
                  <div className="mt-2 space-y-1">
                    {(s.checklistItems ?? []).map((item, i) => (
                      <div key={i} className="flex items-center gap-2 ml-5">
                        <span className="text-slate-500 text-xs">☐</span>
                        <input
                          className="flex-1 bg-slate-800 rounded px-2 py-1 text-xs"
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
                      className="text-xs text-primary-400 hover:text-primary-300 ml-5 flex items-center gap-1"
                    >
                      <Plus size={12} /> 新增 checklist 項目
                    </button>
                  </div>
                )}

                {/* 子步驟：縮排 + 垂直導引線 */}
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
      })}

      <div className="flex items-center gap-4 pt-1">
        <button
          onClick={addStep}
          className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
        >
          <Plus size={14} /> 新增步驟
        </button>
        {depth === 0 && (
          <button
            onClick={addGroupStep}
            className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
          >
            <Plus size={14} /> 新增群組
          </button>
        )}
      </div>
    </div>
  );
}
