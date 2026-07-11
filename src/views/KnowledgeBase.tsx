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
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const activeCategoryId = selectedCategoryId ?? categories[0]?.id ?? null;
  const notesInCategory = notes.filter((n) => n.categoryId === activeCategoryId);
  const selectedNote = notesInCategory.find((n) => n.id === selectedNoteId) ?? notesInCategory[0] ?? null;

  function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    addCategory(newCategoryName.trim());
    setNewCategoryName('');
  }

  function handleAddNote() {
    if (!activeCategoryId) return;
    const id = addNote(activeCategoryId, '', '（新筆記）');
    setSelectedNoteId(id);
  }

  function handleDeleteNote(id: string) {
    deleteNote(id);
    if (selectedNoteId === id) setSelectedNoteId(null);
  }

  return (
    <div className="flex flex-col h-full">
      <h1 className="text-2xl font-semibold mb-1">知識庫</h1>
      <p className="text-slate-400 mb-4 text-sm">全域 SOP／注意事項，跟專案無關，分類可以自由新增。</p>

      {/* 分類（橫向） */}
      <section className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className={`group flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full text-sm cursor-pointer border ${
                activeCategoryId === c.id
                  ? 'bg-primary-600/20 text-primary-400 border-primary-600/40'
                  : 'text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
              onClick={() => { setSelectedCategoryId(c.id); setSelectedNoteId(null); }}
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

      {/* Master-detail layout */}
      <div className="flex gap-4 flex-1" style={{ minHeight: '500px' }}>
        {/* Left: note list */}
        <div className="w-60 shrink-0 flex flex-col bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-400">筆記</span>
            <button
              onClick={handleAddNote}
              disabled={!activeCategoryId}
              className="text-primary-400 hover:text-primary-300 disabled:opacity-40 p-0.5"
              title="新增筆記"
            >
              <Plus size={15} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {notesInCategory.length === 0 && (
              <p className="text-xs text-slate-600 text-center mt-6 px-3">還沒有筆記，點 + 新增</p>
            )}
            {notesInCategory.map((n) => {
              const isActive = (selectedNote?.id === n.id);
              return (
                <button
                  key={n.id}
                  onClick={() => setSelectedNoteId(n.id)}
                  className={`w-full text-left px-3 py-3 border-b border-slate-800 hover:bg-slate-800 transition-colors ${isActive ? 'bg-slate-800 border-l-2 border-l-primary-500' : ''}`}
                >
                  <div className="text-sm font-medium truncate text-slate-200">
                    {n.title || '（無標題）'}
                  </div>
                  <div className="text-xs text-slate-500 truncate mt-0.5">
                    {n.content.replace(/\n/g, ' ').slice(0, 60)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: note editor */}
        <div className="flex-1 flex flex-col bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          {!selectedNote ? (
            <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
              選擇或新增一則筆記
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
                <input
                  className="flex-1 bg-transparent text-base font-semibold outline-none text-slate-100"
                  value={selectedNote.title ?? ''}
                  placeholder="（無標題）"
                  onChange={(e) => updateNote(selectedNote.id, { title: e.target.value })}
                />
                <button
                  onClick={() => handleDeleteNote(selectedNote.id)}
                  className="text-slate-500 hover:text-red-400 p-1 shrink-0"
                  title="刪除筆記"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <textarea
                className="flex-1 w-full bg-transparent px-4 py-3 text-sm text-slate-300 outline-none resize-none leading-relaxed"
                placeholder="內容..."
                value={selectedNote.content === '（新筆記）' ? '' : selectedNote.content}
                onChange={(e) => updateNote(selectedNote.id, { content: e.target.value })}
                autoFocus
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
