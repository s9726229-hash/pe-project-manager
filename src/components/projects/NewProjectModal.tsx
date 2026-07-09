import { useState } from 'react';
import type { Program, Template, TemplateCategory } from '../../types';
import { applyTemplateSteps } from '../../services/scheduling';

interface NewProjectModalProps {
  categories: TemplateCategory[];
  templates: Template[];
  programs: Program[];
  onAddProgram: (name: string) => string;
  onCancel: () => void;
  onCreate: (input: {
    name: string;
    productLine: string;
    grade: string;
    notes: string;
    startDate: string;
    owner: string;
    appliedTemplateId: string;
    programId?: string;
  }) => void;
}

const NEW_PROGRAM_VALUE = '__new__';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function NewProjectModal({ categories, templates, programs, onAddProgram, onCancel, onCreate }: NewProjectModalProps) {
  // 範本不限分類，各種範本都能選——只是預設優先選「專案階段範本」分類底下的預設範本，比較符合多數情況。
  const stageCategory = categories.find((c) => c.name === '專案階段範本');
  const defaultTemplate =
    templates.find((t) => t.categoryId === stageCategory?.id && t.isDefault) ?? templates[0];

  const [programId, setProgramId] = useState('');
  const [newProgramName, setNewProgramName] = useState('');
  const [name, setName] = useState('');
  const [productLine, setProductLine] = useState('');
  const [grade, setGrade] = useState('');
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState(todayIso());
  const [owner, setOwner] = useState('');
  const [templateId, setTemplateId] = useState(defaultTemplate?.id ?? '');

  const creatingProgram = programId === NEW_PROGRAM_VALUE;
  const canSubmit = name.trim() && startDate && templateId && (!creatingProgram || newProgramName.trim());

  function handleSubmit() {
    if (!canSubmit) return;
    let resolvedProgramId = programId || undefined;
    if (creatingProgram) {
      resolvedProgramId = onAddProgram(newProgramName.trim());
    }
    onCreate({
      name: name.trim(),
      productLine: productLine.trim(),
      grade: grade.trim(),
      notes: notes.trim(),
      startDate,
      owner: owner.trim(),
      appliedTemplateId: templateId,
      programId: resolvedProgramId
    });
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md space-y-4">
        <h2 className="text-lg font-semibold">新增專案</h2>
        <p className="text-xs text-slate-500 -mt-2">命名參考：大專案名稱 － 小專案名稱 － 產品線 － 產品等級 － 備註（例：E28－M.2 2280－XXXXX－商－DELL）</p>

        <label className="text-xs text-slate-400 space-y-1 block">
          大專案名稱（選填）
          <select
            className="w-full bg-slate-800 rounded px-2 py-1.5 text-sm"
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
          >
            <option value="">不掛（單獨專案）</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
            <option value={NEW_PROGRAM_VALUE}>＋ 新增大專案...</option>
          </select>
        </label>

        {creatingProgram && (
          <label className="text-xs text-slate-400 space-y-1 block">
            新大專案名稱
            <input
              className="w-full bg-slate-800 rounded px-2 py-1.5 text-sm"
              value={newProgramName}
              onChange={(e) => setNewProgramName(e.target.value)}
            />
          </label>
        )}

        <label className="text-xs text-slate-400 space-y-1 block">
          小專案名稱
          <input className="w-full bg-slate-800 rounded px-2 py-1.5 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-slate-400 space-y-1">
            產品線
            <input className="w-full bg-slate-800 rounded px-2 py-1.5 text-sm" value={productLine} onChange={(e) => setProductLine(e.target.value)} />
          </label>
          <label className="text-xs text-slate-400 space-y-1">
            產品等級
            <input
              className="w-full bg-slate-800 rounded px-2 py-1.5 text-sm"
              placeholder="商規/工規/DC..."
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            />
          </label>
        </div>

        <label className="text-xs text-slate-400 space-y-1 block">
          備註
          <input className="w-full bg-slate-800 rounded px-2 py-1.5 text-sm" placeholder="例：客戶 DELL" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-slate-400 space-y-1">
            啟動日
            <input
              type="date"
              className="w-full bg-slate-800 rounded px-2 py-1.5 text-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label className="text-xs text-slate-400 space-y-1">
            負責窗口
            <input className="w-full bg-slate-800 rounded px-2 py-1.5 text-sm" value={owner} onChange={(e) => setOwner(e.target.value)} />
          </label>
        </div>

        <label className="text-xs text-slate-400 space-y-1 block">
          套用範本
          <select
            className="w-full bg-slate-800 rounded px-2 py-1.5 text-sm"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
          >
            {categories.map((c) => {
              const inCategory = templates.filter((t) => t.categoryId === c.id);
              if (inCategory.length === 0) return null;
              return (
                <optgroup key={c.id} label={c.name}>
                  {inCategory.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                      {t.isDefault ? '（預設）' : ''}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </label>

        {templateId && (
          <p className="text-xs text-slate-500">
            套用後會依範本自動排出完整里程碑時程，套用完仍可在專案裡自由調整。
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200">
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-1.5 text-sm bg-primary-600 hover:bg-primary-500 rounded-lg disabled:opacity-40"
          >
            建立專案
          </button>
        </div>
      </div>
    </div>
  );
}

export function buildMilestonesForTemplate(templates: Template[], templateId: string, startDate: string) {
  const template = templates.find((t) => t.id === templateId);
  if (!template) return [];
  return applyTemplateSteps(template.steps, startDate);
}
