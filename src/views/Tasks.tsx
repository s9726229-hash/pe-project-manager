import { useState } from 'react';
import type { useTasks } from '../hooks/useTasks';
import type { useProjects } from '../hooks/useProjects';
import type { Task } from '../types';
import { getEffectiveDueDate } from '../services/taskUtils';
import { getTasksForTab, type TaskPageTab } from '../services/taskSelectors';
import TaskRow from '../components/tasks/TaskRow';
import NewTaskForm from '../components/tasks/NewTaskForm';

interface TasksProps {
  tasksApi: ReturnType<typeof useTasks>;
  projectsApi: ReturnType<typeof useProjects>;
}

type Bucket = 'overdue' | 'today' | 'week' | 'later' | 'none';

const TABS: TaskPageTab[] = ['全部', '進行中', '延遲', '本週／之後', '已完成'];
const BUCKET_ORDER: Bucket[] = ['overdue', 'today', 'week', 'later', 'none'];
const BUCKET_META: Record<Bucket, { label: string; color: string }> = {
  overdue: { label: '延遲', color: 'text-red-400' },
  today: { label: '今天', color: 'text-amber-400' },
  week: { label: '本週', color: 'text-sky-400' },
  later: { label: '之後', color: 'text-slate-400' },
  none: { label: '未排期限', color: 'text-slate-500' },
};

function todayIso() { return new Date().toISOString().slice(0, 10); }

function addDays(iso: string, n: number) {
  const date = new Date(iso);
  date.setDate(date.getDate() + n);
  return date.toISOString().slice(0, 10);
}

function startOfWeek(iso: string) {
  const date = new Date(iso);
  const day = date.getDay();
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1));
  return date.toISOString().slice(0, 10);
}

function getBucket(dueDate: string | undefined, today: string, weekEnd: string): Bucket {
  if (!dueDate) return 'none';
  if (dueDate < today) return 'overdue';
  if (dueDate === today) return 'today';
  if (dueDate <= weekEnd) return 'week';
  return 'later';
}

export default function Tasks({ tasksApi, projectsApi }: TasksProps) {
  const { tasks, addTask, updateTask, postponeTask, addSubTask, deleteTask } = tasksApi;
  const [activeTab, setActiveTab] = useState<TaskPageTab>('全部');
  const today = todayIso();
  const weekEnd = addDays(startOfWeek(today), 6);
  const visibleTasks = getTasksForTab(tasks, activeTab, today)
    .sort((a, b) => (getEffectiveDueDate(a) ?? '9999-99-99').localeCompare(getEffectiveDueDate(b) ?? '9999-99-99'));
  const buckets: Record<Bucket, Task[]> = { overdue: [], today: [], week: [], later: [], none: [] };

  for (const task of visibleTasks) {
    buckets[getBucket(getEffectiveDueDate(task), today, weekEnd)].push(task);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">任務清單</h1>
      </div>

      <NewTaskForm projects={projectsApi.projects} onCreate={addTask} />

      <div className="mt-5 flex flex-wrap gap-2 border-b border-slate-800 pb-3" role="tablist" aria-label="任務篩選">
        {TABS.map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              id={`task-tab-${tab}`}
              aria-controls="task-tab-panel"
              aria-selected={active}
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${active
                ? 'bg-primary-600/20 text-primary-300'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950`}
            >
              {tab}
              <span className="ml-1.5 text-xs text-slate-500">{getTasksForTab(tasks, tab, today).length}</span>
            </button>
          );
        })}
      </div>

      {visibleTasks.length === 0 && <p className="mt-4 text-sm text-slate-500">目前沒有符合此篩選條件的任務。</p>}

      <div id="task-tab-panel" role="tabpanel" aria-labelledby={`task-tab-${activeTab}`} className="mt-4 space-y-6">
        {BUCKET_ORDER.filter((bucket) => buckets[bucket].length > 0).map((bucket) => (
          <section key={bucket}>
            <div className="mb-3 flex items-center gap-3">
              <span className={`text-xs font-semibold ${BUCKET_META[bucket].color}`}>{BUCKET_META[bucket].label}</span>
              <span className="text-xs text-slate-600">{buckets[bucket].length} 項</span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>
            <div className="space-y-2">
              {buckets[bucket].map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onChange={(updated) => updateTask(updated.id, updated)}
                  onPostpone={postponeTask}
                  onAddSubTask={addSubTask}
                  onDelete={deleteTask}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
