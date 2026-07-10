import { useState } from 'react';
import type { Template, TemplateCategory } from '../../types';

interface NewCaseModalProps {
  categories: TemplateCategory[];
  templates: Template[];
  onCancel: () => void;
  onCreate: (input: { name: string; openDate: string; partNumber?: string; notes?: string; template: Template }) => void;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function NewCaseModal({ categories, templates, onCancel, onCreate }: NewCaseModalProps) {
  const caseCategory = categories.find((c) => c.name === '案件流程範本');
  const defaultTemplate = templates.find((t) => t.categoryId === caseCategory?.id && t.isDefault) ?? templates[0];

  const [name, setName] = useState('');
  const [openDate, setOpenDate] = useState(todayIso());
  const [partNumber, setPartNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [templateId, setTemplateId] = useState(defaultTemplate?.id ?? '');

  const canSubmit = name.trim() && openDate && templateId;

  function handleSubmit() {
    const template = templates.find((t) => t.id === templateId);
    if (!canSubmit || !template) return;
    onCreate({ name: name.trim(), openDate, partNumber: partNumber.trim() || undefined, notes: notes.trim() || undefined, template });
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md space-y-4">
        <h2 className="text-lg font-semibold">新增案件</h2>

        <label className="text-xs text-slate-400 space-y-1 block">
          案件名稱
          <input className="w-full bg-slate-800 rounded px-2 py-1.5 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-slate-400 space-y-1">
            開案日期
            <input
              type="date"
              className="w-full bg-slate-800 rounded px-2 py-1.5 text-sm"
              value={openDate}
              onChange={(e) => setOpenDate(e.target.value)}
            />
          </label>
          <label className="text-xs text-slate-400 space-y-1">
            關聯料號（選填）
            <input className="w-full bg-slate-800 rounded px-2 py-1.5 text-sm" value={partNumber} onChange={(e) => setPartNumber(e.target.value)} />
          </label>
        </div>

        <label className="text-xs text-slate-400 space-y-1 block">
          套用範本
          <select className="w-full bg-slate-800 rounded px-2 py-1.5 text-sm" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
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

        <label className="text-xs text-slate-400 space-y-1 block">
          備註
          <input className="w-full bg-slate-800 rounded px-2 py-1.5 text-sm" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200">
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-1.5 text-sm bg-primary-600 hover:bg-primary-500 rounded-lg disabled:opacity-40"
          >
            建立案件
          </button>
        </div>
      </div>
    </div>
  );
}
