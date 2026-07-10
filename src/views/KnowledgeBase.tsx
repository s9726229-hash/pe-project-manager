import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { useKnowledge } from '../hooks/useKnowledge';
import { estimateWidthCh } from '../services/textWidth';

interface KnowledgeBaseProps {
  knowledgeApi: ReturnType<typeof useKnowledge>;
}

export default function KnowledgeBase({ knowledgeApi }: KnowledgeBaseProps) {
  const { categories, notes, addCategory, renameCategory, deleteCategory, addNote, updateNote, deleteNote } = knowledgeApi;

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const activeCategoryId = selectedCategoryId ?? categories[0]?.id ?? null;
  const notesInCategory = notes.filter((n) => n.categoryId === activeCategoryId);

  function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    addCategory(newCategoryName.trim());
    setNewCategoryName('');
  }

  function handleAddNote() {
    if (!activeCategoryId || !newContent.trim()) return;
    addNote(activeCategoryId, newTitle.trim(), newContent.trim());
    setNewTitle('');
    setNewContent('');
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">知識庫</h1>
      <p className="text-slate-400 mb-6">全域 SOP／注意事項，跟專案無關，分類可以自由新增。</p>

      <section className="mb-6">
        <h2 className="text-sm font-semibold text-slate-400 mb-2">分類</h2>
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className={`group flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full text-sm cursor-pointer border ${
                activeCategoryId === c.id
                  ? 'bg-primary-600/20 text-primary-400 border-primary-600/40'
                  : 'text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
              onClick={() => setSelectedCategoryId(c.id)}
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
                  if (confirm(`刪除分類「${c.name}」？底下的筆記也會一併刪除。`)) deleteCategory(c.id);
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

      <section>
        <h2 className="text-sm font-semibold text-slate-400 mb-2">筆記</h2>

        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 mb-4 space-y-2">
          <input
            className="w-full bg-slate-800 rounded px-2 py-1.5 text-sm"
            placeholder="標題（選填）"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <textarea
            className="w-full bg-slate-800 rounded px-2 py-1.5 text-sm resize-none"
            rows={2}
            placeholder="內容..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
          />
          <button
            onClick={handleAddNote}
            disabled={!activeCategoryId}
            className="flex items-center gap-1 text-sm bg-primary-600 hover:bg-primary-500 rounded-lg px-3 py-1.5 disabled:opacity-40"
          >
            <Plus size={16} /> 新增筆記
          </button>
        </div>

        {notesInCategory.length === 0 && <p className="text-slate-500 text-sm">這個分類還沒有筆記。</p>}

        <div className="space-y-2">
          {notesInCategory.map((n) => (
            <div key={n.id} className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <input
                    className="w-full bg-transparent text-sm font-medium outline-none mb-1"
                    value={n.title ?? ''}
                    placeholder="（無標題）"
                    onChange={(e) => updateNote(n.id, { title: e.target.value })}
                  />
                  <textarea
                    className="w-full bg-transparent text-sm text-slate-300 outline-none resize-none"
                    rows={Math.max(1, n.content.split('\n').length)}
                    value={n.content}
                    onChange={(e) => updateNote(n.id, { content: e.target.value })}
                  />
                </div>
                <button onClick={() => deleteNote(n.id)} className="text-slate-500 hover:text-red-400 p-1 shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
