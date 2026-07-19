import { Check, Flame } from 'lucide-react';
import type { Project, Task } from '../../types';
import { getTaskProjectName } from '../../services/taskSelectors';

interface InProgressTaskListProps {
  tasks: Task[];
  projects: Project[];
  onComplete: (id: string) => void;
}

export default function InProgressTaskList({ tasks, projects, onComplete }: InProgressTaskListProps) {
  if (tasks.length === 0) {
    return <p className="text-slate-500 text-sm py-2">目前沒有進行中的任務。</p>;
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <button
            type="button"
            aria-label={`完成 ${task.title}`}
            onClick={() => onComplete(task.id)}
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-700 text-emerald-400 transition-colors hover:border-emerald-500 hover:bg-emerald-500/10"
          >
            <Check size={12} aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <span className="min-w-0 flex-1 break-words text-sm text-slate-200">{task.title}</span>
              {task.urgent && (
                <span className="flex shrink-0 items-center gap-1 text-xs text-red-400">
                  <Flame size={12} aria-hidden="true" />
                  緊急
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
              <span>{getTaskProjectName(task, projects)}</span>
              <span>{task.dueDate ?? '無到期日'}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
