import { useEffect, useRef, useState } from 'react';
import { BookOpen, CheckSquare, FileText, FolderKanban, Search, X } from 'lucide-react';
import type { Case, KnowledgeCategory, KnowledgeNote, Note, Program, Project, Task } from '../../types';
import { globalSearch, type SearchResult, type SearchResultKind } from '../../services/search';
import type { ViewState } from '../../App';

interface SearchModalProps {
  projects: Project[];
  programs: Program[];
  tasks: Task[];
  cases: Case[];
  notes: Note[];
  knowledgeNotes: KnowledgeNote[];
  knowledgeCategories: KnowledgeCategory[];
  onClose: () => void;
  onNavigate: (view: ViewState) => void;
  onOpenProject: (id: string) => void;
}

const KIND_ICON: Record<SearchResultKind, typeof FolderKanban> = {
  project: FolderKanban,
  task: CheckSquare,
  case: FileText,
  note: FileText,
  knowledge: BookOpen,
};

const KIND_LABEL: Record<SearchResultKind, string> = {
  project: '專案',
  task: '待辦',
  case: '案件',
  note: '備忘',
  knowledge: '知識庫',
};

export default function SearchModal({
  projects, programs, tasks, cases, notes, knowledgeNotes, knowledgeCategories,
  onClose, onNavigate, onOpenProject,
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  const results = globalSearch(query, { projects, programs, tasks, cases, notes, knowledgeNotes, knowledgeCategories });

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setActiveIdx(0); }, [query]);
  useEffect(() => { activeRef.current?.scrollIntoView({ block: 'nearest' }); }, [activeIdx]);

  function handleSelect(r: SearchResult) {
    onClose();
    switch (r.kind) {
      case 'project': onOpenProject(r.id); break;
      case 'task':    onNavigate('TASKS'); break;
      case 'case':
      case 'note':    if (r.projectId) onOpenProject(r.projectId); break;
      case 'knowledge': onNavigate('KNOWLEDGE_BASE'); break;
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[activeIdx]) handleSelect(results[activeIdx]);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 搜尋輸入列 */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
          <Search size={18} className="text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent outline-none text-base placeholder-slate-500"
            placeholder="搜尋專案、待辦、案件、知識庫..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-500 hover:text-slate-300">
              <X size={15} />
            </button>
          )}
        </div>

        {/* 結果列表 */}
        <div className="max-h-80 overflow-y-auto">
          {!query.trim() && (
            <p className="text-slate-600 text-xs text-center py-8">輸入關鍵字開始搜尋</p>
          )}
          {query.trim() && results.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-8">找不到「{query}」的相關結果</p>
          )}
          {results.map((r, i) => {
            const Icon = KIND_ICON[r.kind];
            const isActive = i === activeIdx;
            return (
              <button
                key={`${r.kind}-${r.id}`}
                ref={isActive ? activeRef : undefined}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${isActive ? 'bg-slate-800' : 'hover:bg-slate-800/60'}`}
                onClick={() => handleSelect(r)}
                onMouseEnter={() => setActiveIdx(i)}
              >
                <Icon size={15} className="text-slate-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{r.title}</p>
                  <p className="text-xs text-slate-500 truncate">{r.subtitle}</p>
                </div>
                <span className="text-xs text-slate-600 shrink-0 bg-slate-800 px-1.5 py-0.5 rounded">
                  {KIND_LABEL[r.kind]}
                </span>
              </button>
            );
          })}
        </div>

        {/* 快捷鍵提示 */}
        <div className="px-4 py-2 border-t border-slate-800 flex items-center gap-4 text-xs text-slate-600">
          <span>↑↓ 移動</span>
          <span>Enter 開啟</span>
          <span>Esc 關閉</span>
        </div>
      </div>
    </div>
  );
}
