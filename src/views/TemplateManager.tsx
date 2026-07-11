import { useState } from 'react';
import { Copy, Plus, Star, Trash2 } from 'lucide-react';
import type { useTemplates } from '../hooks/useTemplates';
import StepEditor from '../components/settings/StepEditor';
import { estimateWidthCh } from '../services/textWidth';

interface TemplateManagerProps {
  templatesApi: ReturnType<typeof useTemplates>;
}

export default function TemplateManager({ templatesApi }: TemplateManagerProps) {
  const {
    categories, templates,
    addCategory, renameCategory, deleteCategory,
    addTemplate, duplicateTemplate, deleteTemplate,
    renameTemplate, setDefaultTemplate, updateTemplateSteps
  } = templatesApi;

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newTemplateName, setNewTemplateName] = useState('');

  const catId = activeCategoryId ?? categories[0]?.id ?? null;
  const templatesInCat = templates.filter((t) => t.categoryId === catId);
  const activeTemplate = templates.find((t) => t.id === selectedTemplateId) ?? null;

  function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    addCategory(newCategoryName.trim());
    setNewCategoryName('');
  }

  function handleAddTemplate() {
    if (!catId || !newTemplateName.trim()) return;
    const id = addTemplate(catId, newTemplateName.trim());
    setSelectedTemplateId(id);
    setNewTemplateName('');
  }

  function handleDelete(id: string) {
    if (!confirm('確定刪除這份範本？')) return;
    deleteTemplate(id);
    if (selectedTemplateId === id) setSelectedTemplateId(null);
  }

  return (
    <div className="flex flex-col h-full">
      <h1 className="text-2xl font-semibold mb-1">範本管理</h1>
      <p className="text-slate-400 mb-4 text-sm">分類、範本、步驟都可以自由新增/編輯，資料存在瀏覽器本機。</p>

      {/* Category chips */}
      <section className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className={`group flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full text-sm cursor-pointer border ${
                catId === c.id
                  ? 'bg-primary-600/20 text-primary-400 border-primary-600/40'
                  : 'text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
              onClick={() => { setActiveCategoryId(c.id); setSelectedTemplateId(null); }}
            >
              <input
                className="bg-transparent outline-none"
                style={{ width: `${estimateWidthCh(c.name)}ch` }}
                value={c.name}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => renameCategory(c.id, e.target.value)}
              />
              <button
                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`刪除分類「${c.name}」？底下的範本也會一併刪除。`)) deleteCategory(c.id);
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <input
              className="w-32 bg-slate-800 rounded-full px-3 py-1.5 text-xs"
              placeholder="新分類名稱"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <button onClick={handleAddCategory} className="text-primary-400 hover:text-primary-300 p-1">
              <Plus size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Master-detail */}
      <div className="flex gap-4 flex-1" style={{ minHeight: '500px' }}>
        {/* Left: template list */}
        <div className="w-60 shrink-0 flex flex-col bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-400">範本</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {templatesInCat.length === 0 && (
              <p className="text-xs text-slate-600 text-center mt-6 px-3">還沒有範本，點下方 + 新增</p>
            )}
            {templatesInCat.map((t) => {
              const isActive = selectedTemplateId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplateId(t.id)}
                  className={`w-full text-left px-3 py-3 border-b border-slate-800 hover:bg-slate-800 transition-colors ${
                    isActive ? 'bg-slate-800 border-l-2 border-l-primary-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {t.isDefault && <Star size={11} className="text-amber-400 fill-amber-400 shrink-0" />}
                    <span className="text-sm text-slate-200 truncate">{t.name}</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">{t.steps.length} 個步驟</div>
                </button>
              );
            })}
          </div>
          {/* Add template */}
          <div className="border-t border-slate-800 px-3 py-2 flex items-center gap-1">
            <input
              className="flex-1 bg-slate-800 rounded px-2 py-1 text-xs disabled:opacity-40"
              placeholder="新範本名稱"
              value={newTemplateName}
              disabled={!catId}
              onChange={(e) => setNewTemplateName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTemplate()}
            />
            <button
              onClick={handleAddTemplate}
              disabled={!catId}
              className="text-primary-400 hover:text-primary-300 p-1 disabled:opacity-40 shrink-0"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>

        {/* Right: editor */}
        <div className="flex-1 overflow-y-auto bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          {!activeTemplate ? (
            <div className="h-full flex items-center justify-center text-slate-600 text-sm">選擇或新增一份範本</div>
          ) : (
            <>
              {/* Toolbar */}
              <div className="flex items-center gap-3 mb-5">
                <input
                  className="flex-1 max-w-sm bg-slate-800 rounded px-2 py-1.5 text-base font-semibold outline-none"
                  value={activeTemplate.name}
                  onChange={(e) => renameTemplate(activeTemplate.id, e.target.value)}
                />
                <button
                  onClick={() => setDefaultTemplate(activeTemplate.categoryId, activeTemplate.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg border shrink-0 ${
                    activeTemplate.isDefault
                      ? 'border-amber-400 text-amber-400'
                      : 'border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {activeTemplate.isDefault ? '✓ 預設範本' : '設為預設'}
                </button>
                <button
                  title="複製範本"
                  onClick={() => duplicateTemplate(activeTemplate.id)}
                  className="text-slate-400 hover:text-primary-400 p-1.5"
                >
                  <Copy size={15} />
                </button>
                <button
                  title="刪除範本"
                  onClick={() => handleDelete(activeTemplate.id)}
                  className="text-slate-400 hover:text-red-400 p-1.5"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <StepEditor
                steps={activeTemplate.steps}
                onChange={(steps) => updateTemplateSteps(activeTemplate.id, steps)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
