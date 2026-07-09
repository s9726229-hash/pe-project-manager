import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Project } from '../../types';
import { DEFAULT_PROJECT_ID } from '../../hooks/useProjects';

interface NewTaskFormProps {
  projects: Project[];
  onCreate: (input: { title: string; projectId: string; dueDate?: string; urgent?: boolean }) => void;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function NewTaskForm({ projects, onCreate }: NewTaskFormProps) {
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState(DEFAULT_PROJECT_ID);
  const [dueDate, setDueDate] = useState(todayIso());
  const [urgent, setUrgent] = useState(false);

  function handleSubmit() {
    if (!title.trim()) return;
    onCreate({ title: title.trim(), projectId, dueDate: dueDate || undefined, urgent });
    setTitle('');
    setUrgent(false);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap bg-slate-900/60 border border-slate-800 rounded-lg p-3 mb-4">
      <input
        className="flex-1 min-w-[10rem] bg-slate-800 rounded px-2 py-1.5 text-sm"
        placeholder="新增待辦事項..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
      />
      <select className="bg-slate-800 rounded px-2 py-1.5 text-sm" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <input
        type="date"
        className="bg-slate-800 rounded px-2 py-1.5 text-sm"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />
      <button
        onClick={() => setUrgent((v) => !v)}
        className={`text-sm px-2 py-1.5 rounded ${urgent ? 'bg-red-400/10 text-red-400' : 'bg-slate-800 text-slate-500'}`}
      >
        急件
      </button>
      <button onClick={handleSubmit} className="flex items-center gap-1 text-sm bg-primary-600 hover:bg-primary-500 rounded-lg px-3 py-1.5">
        <Plus size={16} /> 新增
      </button>
    </div>
  );
}
