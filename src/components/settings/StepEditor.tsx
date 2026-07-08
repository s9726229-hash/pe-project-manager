import { Plus, Trash2, X } from 'lucide-react';
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

export default function StepEditor({ steps, onChange, depth = 0 }: StepEditorProps) {
  function addStep() {
    onChange([...steps, { id: newId(), name: '新步驟', groupOrder: steps.length + 1 }]);
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
    // 一旦有子步驟，這個步驟就變成「群組節點」，不再保留自己的 checklist/工期。
    const subSteps = [...(step.subSteps ?? []), { id: newId(), name: '新子步驟', groupOrder: (step.subSteps?.length ?? 0) + 1 }];
    onChange(updateStepAt(steps, step.id, { subSteps, checklistItems: undefined, durationDays: undefined }));
  }

  return (
    <div className="space-y-3">
      {steps.map((s) => {
        const isGroup = !!s.subSteps && s.subSteps.length > 0;
        return (
          <div key={s.id} className={`rounded-lg border border-slate-800 p-3 bg-slate-900/60 ${depth > 0 ? 'ml-6' : ''}`}>
            <div className="flex items-center gap-2">
              <input
                className="flex-1 min-w-0 bg-slate-800 rounded px-2 py-1 text-sm"
                value={s.name}
                onChange={(e) => onChange(updateStepAt(steps, s.id, { name: e.target.value }))}
                placeholder="步驟名稱"
              />
              <button
                onClick={() => onChange(removeStepAt(steps, s.id))}
                className="text-slate-500 hover:text-red-400 p-1 shrink-0"
                title="刪除步驟"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2">
              <label className="text-xs text-slate-400 flex items-center gap-1 whitespace-nowrap shrink-0">
                並行群組
                <input
                  type="number"
                  className="w-14 bg-slate-800 rounded px-2 py-1 text-sm"
                  value={s.groupOrder}
                  onChange={(e) => onChange(updateStepAt(steps, s.id, { groupOrder: Number(e.target.value) }))}
                />
              </label>
              {!isGroup && (
                <label className="text-xs text-slate-400 flex items-center gap-1 whitespace-nowrap shrink-0">
                  工期(天)
                  <input
                    type="number"
                    className="w-16 bg-slate-800 rounded px-2 py-1 text-sm"
                    value={s.durationDays ?? ''}
                    onChange={(e) =>
                      onChange(updateStepAt(steps, s.id, { durationDays: e.target.value === '' ? undefined : Number(e.target.value) }))
                    }
                  />
                </label>
              )}
            </div>

            {isGroup && <p className="text-xs text-slate-500 mt-2">此步驟為分組容器，狀態由子步驟推算，不記錄自己的日期/checklist。</p>}

            {!isGroup && (
              <div className="mt-2 space-y-1">
                {(s.checklistItems ?? []).map((item, i) => (
                  <div key={i} className="flex items-center gap-2 ml-2">
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
                  className="text-xs text-primary-400 hover:text-primary-300 ml-2 flex items-center gap-1"
                >
                  <Plus size={12} /> 新增 checklist 項目
                </button>
              </div>
            )}

            {s.subSteps && s.subSteps.length > 0 && (
              <div className="mt-3">
                <StepEditor
                  steps={s.subSteps}
                  onChange={(subSteps) => onChange(updateStepAt(steps, s.id, { subSteps }))}
                  depth={depth + 1}
                />
              </div>
            )}

            {depth === 0 && (
              <button
                onClick={() => addSubStep(s)}
                className="text-xs text-slate-400 hover:text-primary-400 mt-2 flex items-center gap-1"
              >
                <Plus size={12} /> 新增子步驟
              </button>
            )}
          </div>
        );
      })}
      <button
        onClick={addStep}
        className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
      >
        <Plus size={14} /> 新增步驟
      </button>
    </div>
  );
}
