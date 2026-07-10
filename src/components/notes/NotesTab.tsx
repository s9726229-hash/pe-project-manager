import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Note } from '../../types';

interface NotesTabProps {
  notes: Note[];
  onAdd: (content: string) => void;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

function formatDate(iso: string): string {
  return iso.slice(0, 16).replace('T', ' ');
}

export default function NotesTab({ notes, onAdd, onUpdate, onDelete }: NotesTabProps) {
  const [newContent, setNewContent] = useState('');

  function handleAdd() {
    if (!newContent.trim()) return;
    onAdd(newContent.trim());
    setNewContent('');
  }

  return (
    <div>
      <div className="flex items-start gap-2 mb-4">
        <textarea
          className="flex-1 bg-slate-800 rounded px-3 py-2 text-sm resize-none"
          rows={2}
          placeholder="隨手記點什麼..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
        />
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 text-sm bg-primary-600 hover:bg-primary-500 rounded-lg px-3 py-2 shrink-0"
        >
          <Plus size={16} /> 新增
        </button>
      </div>

      {notes.length === 0 && <p className="text-slate-500 text-sm">還沒有備忘事項。</p>}

      <div className="space-y-2">
        {notes.map((n) => (
          <div key={n.id} className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <textarea
                className="flex-1 bg-transparent text-sm resize-none outline-none"
                rows={Math.max(1, n.content.split('\n').length)}
                value={n.content}
                onChange={(e) => onUpdate(n.id, e.target.value)}
              />
              <button onClick={() => onDelete(n.id)} className="text-slate-500 hover:text-red-400 p-1 shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
            <div className="text-xs text-slate-500 mt-1">{formatDate(n.updatedAt)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
