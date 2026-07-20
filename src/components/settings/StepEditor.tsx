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

const PARALLEL_COLORS = ['#475569', '#10b981', '#3b82f6', '#f59e0b', '#a855f7', '#f43f5e'];
function parallelColor(groupOrder: number): string {
  return PARALLEL_COLORS[groupOrder % PARALLEL_COLORS.length] ?? '#475569';
}

interface Segment {
  order: number;
  items: Array<{ step: TemplateStep; idx: number }>;
}

function buildSegments(steps: TemplateStep[]): Segment[] {
  return [...new Set(steps.map((step) => step.groupOrder))]
    .sort((a, b) => a - b)
    .map((order) => ({
      order,
      items: steps.flatMap((step, idx) => step.groupOrder === order ? [{ step, idx }] : []),
    }));
}

function moveGroup(steps: TemplateStep[], groupOrder: number, direction: -1 | 1): TemplateStep[] {
  const groupOrders = [...new Set(steps.map((step) => step.groupOrder))].sort((a, b) => a - b);
  const targetOrder = groupOrders[groupOrders.indexOf(groupOrder) + direction];
  if (targetOrder === undefined) return steps;
  return steps.map((step) => {
    if (step.groupOrder === groupOrder) return { ...step, groupOrder: targetOrder };
    if (step.groupOrder === targetOrder) return { ...step, groupOrder };
    return step;
  });
}

function groupDuration(items: Segment['items']): number {
  return Math.max(0, ...items.map(({ step }) => step.durationDays ?? 0));
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

  function moveToAdjacentGroup(s: TemplateStep, direction: -1 | 1, siblings: TemplateStep[], onSibChange: (next: TemplateStep[]) => void) {
    const groupOrders = [...new Set(siblings.map((step) => step.groupOrder))].sort((a, b) => a - b);
    const currentIndex = groupOrders.indexOf(s.groupOrder);
    const target = groupOrders[currentIndex + direction];
    if (target !== undefined) onSibChange(updateStepAt(siblings, s.id, { groupOrder: target }));
  }

  function addParallelStep(s: TemplateStep, siblings: TemplateStep[], onSibChange: (next: TemplateStep[]) => void) {
    onSibChange([...siblings, { id: newId(), name: '新子步驟', groupOrder: s.groupOrder }]);
  }

  // ─── Leaf row (inside a group container) ───
  function renderLeaf(
    s: TemplateStep,
    siblings: TemplateStep[],
    onSibChange: (next: TemplateStep[]) => void
  ) {
    return (
      <div key={s.id}>
        {/* Step row */}
        <div className="flex items-center gap-1.5 px-3 py-2.5 group/row hover:bg-slate-800/30 transition-colors">
          <div className="flex shrink-0 gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
            <button
              aria-label={`${s.name}移到上一組`}
              title="移到上一組"
              onClick={() => moveToAdjacentGroup(s, -1, siblings, onSibChange)}
              disabled={!buildSegments(siblings).some((segment) => segment.order < s.groupOrder)}
              className="text-slate-600 hover:text-slate-300 disabled:opacity-20 p-0.5"
            >
              <ArrowUp size={11} />
            </button>
            <button
              aria-label={`${s.name}移到下一組`}
              title="移到下一組"
              onClick={() => moveToAdjacentGroup(s, 1, siblings, onSibChange)}
              disabled={!buildSegments(siblings).some((segment) => segment.order > s.groupOrder)}
              className="text-slate-600 hover:text-slate-300 disabled:opacity-20 p-0.5"
            >
              <ArrowDown size={11} />
            </button>
            <button
              aria-label={`${s.name}加入同組並行任務`}
              title="加入同組並行任務"
              onClick={() => addParallelStep(s, siblings, onSibChange)}
              className="text-slate-600 hover:text-primary-400 p-0.5"
            >
              <Plus size={11} />
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
              工期
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
  function renderGroup(s: TemplateStep) {
    const isCollapsed = collapsed.has(s.id);
    const subSteps = s.subSteps ?? [];
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
          {/* Move + Delete (hover) */}
          <div className="flex items-center gap-1 opacity-0 group-hover/hdr:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
            <button aria-label={`${s.name}移到上一組`} title="移到上一組" onClick={() => onChange(moveGroup(steps, s.groupOrder, -1))} disabled={!buildSegments(steps).some((segment) => segment.order < s.groupOrder)} className="text-slate-500 hover:text-slate-200 disabled:opacity-20 p-0.5">
              <ArrowUp size={12} />
            </button>
            <button aria-label={`${s.name}移到下一組`} title="移到下一組" onClick={() => onChange(moveGroup(steps, s.groupOrder, 1))} disabled={!buildSegments(steps).some((segment) => segment.order > s.groupOrder)} className="text-slate-500 hover:text-slate-200 disabled:opacity-20 p-0.5">
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
            {subSegs.map((seg, segmentIndex) => {
              const isParallel = seg.items.length > 1;
              const color = parallelColor(seg.order);
              return (
                <div key={`pg-${seg.order}`}>
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/40">
                    <div className="flex-1 h-px" style={{ background: color, opacity: 0.3 }} />
                    <span className="text-xs whitespace-nowrap text-slate-300">第 {segmentIndex + 1} 組</span>
                    <span className="text-xs whitespace-nowrap" style={{ color, opacity: 0.9 }}>{isParallel ? '並行啟動' : '依序啟動'}</span>
                    <span className="text-xs whitespace-nowrap text-slate-400">群組工期 {groupDuration(seg.items)} 天</span>
                    <div className="flex-1 h-px" style={{ background: color, opacity: 0.3 }} />
                  </div>
                  {seg.items.map(({ step: sub }) => renderLeaf(sub, subSteps, onSubChange))}
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
          const { step: s } = seg.items[0];
          if (s.subSteps && s.subSteps.length > 0) return renderGroup(s);
          // Top-level leaf (rare)
          return renderLeaf(s, steps, onChange);
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
              {seg.items.map(({ step: s }) =>
                s.subSteps && s.subSteps.length > 0 ? renderGroup(s) : renderLeaf(s, steps, onChange)
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
