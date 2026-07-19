import { useState } from 'react';
import { Plus } from 'lucide-react';
import { DEFAULT_PROJECT_ID } from '../../hooks/useProjects';
import type { Project } from '../../types';

interface NewTaskFormProps {
  projects: Project[];
  onCreate: (input: { title: string; projectId: string; dueDate?: string; urgent?: boolean }) => void;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function NewTaskForm({ projects, onCreate }: NewTaskFormProps) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(todayIso());
  const [urgent, setUrgent] = useState(false);
  const [projectId, setProjectId] = useState(DEFAULT_PROJECT_ID);

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
      <select
        aria-label="選擇所屬專案"
        className="bg-slate-800 rounded px-2 py-1.5 text-sm"
        value={projectId}
        onChange={(event) => setProjectId(event.target.value)}
      >
        <option value={DEFAULT_PROJECT_ID}>日常行政/雜項</option>
        {projects
          .filter((project) => project.id !== DEFAULT_PROJECT_ID && project.status === '進行中')
          .map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
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
