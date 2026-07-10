import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { ProjectDocument } from '../../types';

interface DocumentsTabProps {
  documents: ProjectDocument[];
  onAdd: (input: { type: ProjectDocument['type']; title: string; date: string; link?: string; content?: string }) => void;
  onUpdate: (id: string, patch: Partial<ProjectDocument>) => void;
  onDelete: (id: string) => void;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function DocumentsTab({ documents, onAdd, onUpdate, onDelete }: DocumentsTabProps) {
  const [type, setType] = useState<ProjectDocument['type']>('會議記錄');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayIso());
  const [link, setLink] = useState('');
  const [content, setContent] = useState('');

  function handleAdd() {
    if (!title.trim()) return;
    onAdd({ type, title: title.trim(), date, link: link.trim() || undefined, content: content.trim() || undefined });
    setTitle('');
    setLink('');
    setContent('');
  }

  return (
    <div>
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 mb-4 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <select className="bg-slate-800 rounded px-2 py-1.5 text-sm" value={type} onChange={(e) => setType(e.target.value as ProjectDocument['type'])}>
            <option value="會議記錄">會議記錄</option>
            <option value="文件連結">文件連結</option>
          </select>
          <input
            className="flex-1 min-w-[8rem] bg-slate-800 rounded px-2 py-1.5 text-sm"
            placeholder="標題"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input type="date" className="bg-slate-800 rounded px-2 py-1.5 text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <input
          className="w-full bg-slate-800 rounded px-2 py-1.5 text-sm"
          placeholder="連結（選填）"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
        <textarea
          className="w-full bg-slate-800 rounded px-2 py-1.5 text-sm resize-none"
          rows={2}
          placeholder="內容/摘要（選填）"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button onClick={handleAdd} className="flex items-center gap-1 text-sm bg-primary-600 hover:bg-primary-500 rounded-lg px-3 py-1.5">
          <Plus size={16} /> 新增
        </button>
      </div>

      {documents.length === 0 && <p className="text-slate-500 text-sm">還沒有文件/會議記錄。</p>}

      <div className="space-y-2">
        {documents.map((d) => (
          <div key={d.id} className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">{d.type}</span>
              <input
                className="flex-1 bg-transparent text-sm font-medium outline-none"
                value={d.title}
                onChange={(e) => onUpdate(d.id, { title: e.target.value })}
              />
              <span className="text-xs text-slate-500 shrink-0">{d.date}</span>
              <button onClick={() => onDelete(d.id)} className="text-slate-500 hover:text-red-400 p-1 shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
            {d.link && (
              <a href={d.link} target="_blank" rel="noreferrer" className="text-xs text-primary-400 hover:underline block mt-1">
                {d.link}
              </a>
            )}
            {d.content && <p className="text-xs text-slate-400 mt-1 whitespace-pre-wrap">{d.content}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
