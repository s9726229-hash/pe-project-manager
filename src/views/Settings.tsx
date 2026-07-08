import { useState } from 'react';
import { Copy, Plus, Star, Trash2 } from 'lucide-react';
import { useTemplates } from '../hooks/useTemplates';
import StepEditor from '../components/settings/StepEditor';

export default function Settings() {
  const {
    categories,
    templates,
    addCategory,
    deleteCategory,
    addTemplate,
    duplicateTemplate,
    deleteTemplate,
    renameTemplate,
    setDefaultTemplate,
    updateTemplateSteps
  } = useTemplates();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  const activeCategoryId = selectedCategoryId ?? categories[0]?.id ?? null;
  const templatesInCategory = templates.filter((t) => t.categoryId === activeCategoryId);
  const activeTemplate = templates.find((t) => t.id === selectedTemplateId) ?? null;

  function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    addCategory(newCategoryName.trim());
    setNewCategoryName('');
  }

  function handleAddTemplate() {
    if (!activeCategoryId) return;
    const name = prompt('新範本名稱？');
    if (!name) return;
    const id = addTemplate(activeCategoryId, name);
    setSelectedTemplateId(id);
  }

  function handleDeleteTemplate(id: string) {
    if (!confirm('確定刪除這份範本？')) return;
    deleteTemplate(id);
    if (selectedTemplateId === id) setSelectedTemplateId(null);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">設定</h1>
      <p className="text-slate-400 mb-6">範本管理——分類、範本、步驟都可以自由新增/編輯，資料存在瀏覽器本機。</p>

      <div className="grid grid-cols-[200px_240px_1fr] gap-4">
        {/* 分類清單 */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 mb-2">範本分類</h2>
          <div className="space-y-1">
            {categories.map((c) => (
              <div
                key={c.id}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer ${
                  activeCategoryId === c.id ? 'bg-primary-600/20 text-primary-400' : 'hover:bg-slate-800 text-slate-300'
                }`}
                onClick={() => {
                  setSelectedCategoryId(c.id);
                  setSelectedTemplateId(null);
                }}
              >
                <span>{c.name}</span>
                <button
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`刪除分類「${c.name}」？底下的範本也會一併刪除。`)) deleteCategory(c.id);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-1">
            <input
              className="flex-1 bg-slate-800 rounded px-2 py-1 text-xs"
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

        {/* 範本清單 */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 mb-2">範本</h2>
          <div className="space-y-1">
            {templatesInCategory.map((t) => (
              <div
                key={t.id}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer ${
                  selectedTemplateId === t.id ? 'bg-primary-600/20 text-primary-400' : 'hover:bg-slate-800 text-slate-300'
                }`}
                onClick={() => setSelectedTemplateId(t.id)}
              >
                <span className="flex items-center gap-1">
                  {t.isDefault && <Star size={12} className="text-amber-400 fill-amber-400" />}
                  {t.name}
                </span>
                <span className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                  <button
                    title="複製"
                    className="text-slate-500 hover:text-primary-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateTemplate(t.id);
                    }}
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    title="刪除"
                    className="text-slate-500 hover:text-red-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTemplate(t.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={handleAddTemplate}
            disabled={!activeCategoryId}
            className="mt-3 text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 disabled:opacity-40"
          >
            <Plus size={14} /> 新增範本
          </button>
        </div>

        {/* 範本編輯區 */}
        <div>
          {!activeTemplate && <p className="text-slate-500 text-sm">選一份範本來編輯步驟。</p>}
          {activeTemplate && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <input
                  className="bg-slate-800 rounded px-2 py-1 text-lg font-semibold flex-1"
                  value={activeTemplate.name}
                  onChange={(e) => renameTemplate(activeTemplate.id, e.target.value)}
                />
                <button
                  onClick={() => setDefaultTemplate(activeTemplate.categoryId, activeTemplate.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg border ${
                    activeTemplate.isDefault
                      ? 'border-amber-400 text-amber-400'
                      : 'border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {activeTemplate.isDefault ? '✓ 這是預設範本' : '設為預設範本'}
                </button>
              </div>
              <StepEditor
                steps={activeTemplate.steps}
                onChange={(steps) => updateTemplateSteps(activeTemplate.id, steps)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
