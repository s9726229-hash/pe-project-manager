import { Flame } from 'lucide-react';
import type { useTasks } from '../hooks/useTasks';
import type { useProjects } from '../hooks/useProjects';
import { flattenTaskLeaves } from '../services/taskUtils';

interface DashboardProps {
  tasksApi: ReturnType<typeof useTasks>;
  projectsApi: ReturnType<typeof useProjects>;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function Dashboard({ tasksApi, projectsApi }: DashboardProps) {
  const { tasks } = tasksApi;
  const { projects } = projectsApi;
  const projectById = new Map(projects.map((p) => [p.id, p]));

  const today = todayIso();
  const todayTasks = flattenTaskLeaves(tasks)
    .filter((t) => t.dueDate && t.dueDate <= today && t.status !== '已完成')
    .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1));

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-300">今日待辦</h2>
          <span className="text-xs text-slate-500">{todayTasks.length} 件</span>
        </div>

        {todayTasks.length === 0 && <p className="text-slate-500 text-sm">今天沒有到期或逾期的事項。</p>}

        <div className="space-y-1">
          {todayTasks.slice(0, 8).map((t) => (
            <div key={t.id} className="flex items-center gap-2 text-sm py-1">
              {t.urgent && <Flame size={13} className="text-red-400 shrink-0" />}
              <span className="flex-1 truncate">{t.title}</span>
              <span className="text-xs text-slate-500 shrink-0">{projectById.get(t.projectId)?.name ?? '—'}</span>
              <span className={`text-xs shrink-0 ${t.dueDate! < today ? 'text-red-400' : 'text-slate-500'}`}>{t.dueDate}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-slate-500 text-sm">未結案問題數、進行中專案卡片，將在階段 4、6 實作。</p>
    </div>
  );
}
