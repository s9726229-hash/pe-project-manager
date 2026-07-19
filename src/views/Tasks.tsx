import { useState } from 'react';
import type { useTasks } from '../hooks/useTasks';
import type { useProjects } from '../hooks/useProjects';
import type { Task } from '../types';
import { getEffectiveDueDate, getEffectiveStatus } from '../services/taskUtils';
import TaskRow from '../components/tasks/TaskRow';
import NewTaskForm from '../components/tasks/NewTaskForm';

interface TasksProps {
  tasksApi: ReturnType<typeof useTasks>;
  projectsApi: ReturnType<typeof useProjects>;
}

function todayIso() { return new Date().toISOString().slice(0, 10); }

function addDays(iso: string, n: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function startOfWeek(iso: string) {
  const d = new Date(iso);
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1)); // Mon
  return d.toISOString().slice(0, 10);
}

type Bucket = 'overdue' | 'today' | 'week' | 'later' | 'none';

const BUCKET_META: Record<Bucket, { label: string; color: string }> = {
  overdue: { label: '逾期',   color: 'text-red-400' },
  today:   { label: '今天',   color: 'text-amber-400' },
  week:    { label: '本週',   color: 'text-sky-400' },
  later:   { label: '之後',   color: 'text-slate-400' },
  none:    { label: '無期限', color: 'text-slate-500' },
};

function getBucket(dueDate: string | undefined, today: string, weekEnd: string): Bucket {
  if (!dueDate) return 'none';
  if (dueDate < today) return 'overdue';
  if (dueDate === today) return 'today';
  if (dueDate <= weekEnd) return 'week';
  return 'later';
}

export default function Tasks({ tasksApi, projectsApi }: TasksProps) {
  const { tasks, addTask, updateTask, postponeTask, addSubTask, deleteTask } = tasksApi;
  const [showCompleted, setShowCompleted] = useState(false);

  const today   = todayIso();
  const weekEnd = addDays(startOfWeek(today), 6); // Sun

  const visibleTasks = (showCompleted ? tasks : tasks.filter((t) => getEffectiveStatus(t) !== '已完成'))
    .sort((a, b) => {
      const da = getEffectiveDueDate(a) ?? '9999-99-99';
      const db = getEffectiveDueDate(b) ?? '9999-99-99';
      return da.localeCompare(db);
    });

  const buckets: Record<Bucket, Task[]> = { overdue: [], today: [], week: [], later: [], none: [] };
  for (const t of visibleTasks) {
    buckets[getBucket(getEffectiveDueDate(t), today, weekEnd)].push(t);
  }

  const BUCKET_ORDER: Bucket[] = ['overdue', 'today', 'week', 'later', 'none'];

  function updateTopLevelTask(updated: Task) { updateTask(updated.id, updated); }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">待辦事項</h1>
        <label className="text-xs text-slate-400 flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={showCompleted} onChange={(e) => setShowCompleted(e.target.checked)} />
          顯示已完成
        </label>
      </div>

      <NewTaskForm projects={projectsApi.projects} onCreate={addTask} />

      {visibleTasks.length === 0 && <p className="text-slate-500 text-sm mt-4">目前沒有待辦事項。</p>}

      <div className="space-y-6 mt-4">
        {BUCKET_ORDER.filter((b) => buckets[b].length > 0).map((b) => (
          <div key={b}>
            {/* 群組標題 */}
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-xs font-semibold ${BUCKET_META[b].color}`}>
                {BUCKET_META[b].label}
              </span>
              <span className="text-xs text-slate-600">{buckets[b].length} 件</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            <div className="space-y-2">
              {buckets[b].map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  onChange={updateTopLevelTask}
                  onPostpone={postponeTask}
                  onAddSubTask={addSubTask}
                  onDelete={deleteTask}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
