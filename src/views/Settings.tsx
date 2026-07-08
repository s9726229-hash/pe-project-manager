import { useState } from 'react';
import { Copy, Plus, Star, Trash2 } from 'lucide-react';
import { useTemplates } from '../hooks/useTemplates';
import StepEditor from '../components/settings/StepEditor';

// 粗略估計文字寬度（ch 單位）：中日韓全形字視覺寬度約是拉丁字母的兩倍，
// 直接用字元數當 ch 數會讓中文名稱被裁切，所以全形字元算 2、其餘算 1。
function estimateWidthCh(text: string): number {
  let width = 0;
  for (const ch of text) {
    width += /[　-鿿＀-￯]/.test(ch) ? 2 : 1;
  }
  return Math.max(width + 1, 3);
}

export default function Settings() {
  const {
    categories,
    templates,
    addCategory,
    renameCategory,
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
  const [newTemplateName, setNewTemplateName] = useState('');

  const activeCategoryId = selectedCategoryId ?? categories[0]?.id ?? null;
  const templatesInCategory = templates.filter((t) => t.categoryId === activeCategoryId);
  const activeTemplate = templates.find((t) => t.id === selectedTemplateId) ?? null;

  function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    addCategory(newCategoryName.trim());
    setNewCategoryName('');
  }

  function handleAddTemplate() {
    if (!activeCategoryId || !newTemplateName.trim()) return;
    const id = addTemplate(activeCategoryId, newTemplateName.trim());
    setSelectedTemplateId(id);
    setNewTemplateName('');
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

      {/* 分類（橫向） */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-slate-400 mb-2">範本分類</h2>
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className={`group flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full text-sm cursor-pointer border ${
                activeCategoryId === c.id
                  ? 'bg-primary-600/20 text-primary-400 border-primary-600/40'
                  : 'text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
              onClick={() => {
                setSelectedCategoryId(c.id);
                setSelectedTemplateId(null);
              }}
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

      {/* 範本（橫向） */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-slate-400 mb-2">範本</h2>
        <div className="flex flex-wrap items-center gap-2">
          {templatesInCategory.map((t) => (
            <div
              key={t.id}
              className={`group flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full text-sm cursor-pointer border ${
                selectedTemplateId === t.id
                  ? 'bg-primary-600/20 text-primary-400 border-primary-600/40'
                  : 'text-slate-300 border-slate-700 hover:bg-slate-800'
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
                  <Copy size={13} />
                </button>
                <button
                  title="刪除"
                  className="text-slate-500 hover:text-red-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTemplate(t.id);
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <input
              className="w-32 bg-slate-800 rounded-full px-3 py-1.5 text-xs disabled:opacity-40"
              placeholder="新範本名稱"
              value={newTemplateName}
              disabled={!activeCategoryId}
              onChange={(e) => setNewTemplateName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTemplate()}
            />
            <button
              onClick={handleAddTemplate}
              disabled={!activeCategoryId}
              className="text-primary-400 hover:text-primary-300 p-1 disabled:opacity-40"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* 範本編輯區（滿版寬度） */}
      <section>
        <h2 className="text-sm font-semibold text-slate-400 mb-2">步驟編輯</h2>
        {!activeTemplate && <p className="text-slate-500 text-sm">選一份範本來編輯步驟。</p>}
        {activeTemplate && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <input
                className="bg-slate-800 rounded px-2 py-1 text-lg font-semibold flex-1 max-w-md"
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
                {activeTemplate.isDefault ? '✓ 這是預設範本' : '設為預設範本'}
              </button>
            </div>
            <StepEditor
              steps={activeTemplate.steps}
              onChange={(steps) => updateTemplateSteps(activeTemplate.id, steps)}
            />
          </div>
        )}
      </section>
    </div>
  );
}
