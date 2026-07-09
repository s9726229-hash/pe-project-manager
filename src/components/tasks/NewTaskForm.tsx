import { useState } from 'react';
import { Plus } from 'lucide-react';
import { DEFAULT_PROJECT_ID } from '../../hooks/useProjects';

interface NewTaskFormProps {
  onCreate: (input: { title: string; projectId: string; dueDate?: string; urgent?: boolean }) => void;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function NewTaskForm({ onCreate }: NewTaskFormProps) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(todayIso());
  const [urgent, setUrgent] = useState(false);

  function handleSubmit() {
    if (!title.trim()) return;
    // 新任務預設掛在「日常行政/雜項」，要歸到哪個專案之後在清單上改就好，不用新增當下就選。
    onCreate({ title: title.trim(), projectId: DEFAULT_PROJECT_ID, dueDate: dueDate || undefined, urgent });
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
