import { AlertTriangle, CalendarDays, Check, Flame } from 'lucide-react';
import type { useProjects } from '../hooks/useProjects';
import type { usePrograms } from '../hooks/usePrograms';
import type { useTasks } from '../hooks/useTasks';
import { DEFAULT_PROJECT_ID } from '../hooks/useProjects';
import type { Project, Task } from '../types';
import { flattenLeaves } from '../services/milestoneUtils';
import {
  getInProgressTaskLeaves,
  getOverdueTaskLeaves,
  getTaskProjectName,
  getUpcomingTaskLeaves,
  getPendingTaskLeaves,
  limitTaskPreview,
  sortTasksByDueDate,
} from '../services/taskSelectors';

interface DashboardProps {
  tasksApi: ReturnType<typeof useTasks>;
  projectsApi: ReturnType<typeof useProjects>;
  casesApi: unknown;
  programsApi: ReturnType<typeof usePrograms>;
  onOpenProject: (projectId: string) => void;
  onOpenTasks: () => void;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function startOfWeek(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  const day = date.getDay();
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1));
  return date.toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDateChinese(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日　週${weekdays[date.getDay()]}`;
}

function ProjectRiskCard({ project, today, weekEnd, onOpen }: {
  project: Project;
  today: string;
  weekEnd: string;
  onOpen: () => void;
}) {
  const riskMilestones = flattenLeaves(project.milestones)
    .filter((milestone) => milestone.status !== '已完成' && milestone.plannedDate && milestone.plannedDate <= weekEnd)
    .sort((a, b) => (a.plannedDate ?? '').localeCompare(b.plannedDate ?? ''));
  if (riskMilestones.length === 0) return null;

  const overdueCount = riskMilestones.filter((milestone) => milestone.plannedDate! < today).length;
  const nextMilestone = riskMilestones[0];
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-left transition-colors hover:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 truncate text-sm font-medium text-slate-200">{project.name}</span>
        {overdueCount > 0 && <span className="flex shrink-0 items-center gap-1 text-xs text-red-400"><AlertTriangle size={12} />{overdueCount} 逾期</span>}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
        <span className="truncate">{nextMilestone.name}</span>
        <span className={nextMilestone.plannedDate! < today ? 'shrink-0 text-red-400' : 'shrink-0 text-amber-400'}>{nextMilestone.plannedDate}</span>
      </div>
    </button>
  );
}

function TaskWorkbenchRow({ task, projects, overdue, onComplete }: {
  task: Task;
  projects: Project[];
  overdue?: boolean;
  onComplete: () => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
      <button
        type="button"
        aria-label={`完成 ${task.title}`}
        onClick={onComplete}
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-700 text-emerald-400 transition-colors hover:border-emerald-500 hover:bg-emerald-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
      >
        <Check size={12} aria-hidden="true" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <span className="min-w-0 flex-1 break-words text-sm text-slate-200">{task.title}</span>
          {task.urgent && <span className="flex shrink-0 items-center gap-1 text-xs text-red-400"><Flame size={12} aria-hidden="true" />緊急</span>}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
          <span>{getTaskProjectName(task, projects)}</span>
          <span className={overdue ? 'text-red-400' : undefined}>{task.dueDate ?? '無到期日'}</span>
        </div>
      </div>
    </div>
  );
}

function TaskSection({ title, count, tasks, projects, overdue, onComplete, empty }: {
  title: string;
  count: number;
  tasks: Task[];
  projects: Project[];
  overdue?: boolean;
  onComplete: (id: string) => void;
  empty: string;
}) {
  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {title}<span className="ml-2 font-normal normal-case text-slate-600">{count} 件</span>
      </h3>
      {tasks.length === 0 ? <p className="py-2 text-sm text-slate-500">{empty}</p> : (
        <div className="space-y-2">
          {tasks.map((task) => <TaskWorkbenchRow key={task.id} task={task} projects={projects} overdue={overdue} onComplete={() => onComplete(task.id)} />)}
        </div>
      )}
    </section>
  );
}

export default function Dashboard({ tasksApi, projectsApi, onOpenProject, onOpenTasks }: DashboardProps) {
  const { tasks, setStatus } = tasksApi;
  const { projects } = projectsApi;
  const today = todayIso();
  const weekEnd = addDays(startOfWeek(today), 6);
  const overdueTasks = sortTasksByDueDate(getOverdueTaskLeaves(tasks, today));
  const inProgressTasks = sortTasksByDueDate(getInProgressTaskLeaves(tasks));
  const upcomingTasks = sortTasksByDueDate(getUpcomingTaskLeaves(tasks, today, weekEnd));
  const priorityIds = new Set([...overdueTasks, ...upcomingTasks].map((task) => task.id));
  const laterTasks = sortTasksByDueDate(getPendingTaskLeaves(tasks).filter((task) => !priorityIds.has(task.id)));
  const activeProjects = projects.filter((project) => project.id !== DEFAULT_PROJECT_ID && project.status !== '取消' && project.status !== '已完成');
  const riskProjects = activeProjects.filter((project) => flattenLeaves(project.milestones).some(
    (milestone) => milestone.status !== '已完成' && milestone.plannedDate && milestone.plannedDate <= weekEnd
  ));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">儀表板</h1>
          <p className="mt-0.5 text-sm text-slate-500">依優先順序整理現在與接下來的工作。</p>
        </div>
        <span className="shrink-0 text-xs font-mono tabular-nums text-slate-600">{formatDateChinese(today)}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3"><div className="text-xl font-bold text-red-400">{overdueTasks.length}</div><div className="mt-1 text-xs text-slate-500">逾期任務</div></div>
        <div className="rounded-xl border border-primary-400/20 bg-primary-400/5 p-3"><div className="text-xl font-bold text-primary-400">{inProgressTasks.length}</div><div className="mt-1 text-xs text-slate-500">進行中工作</div></div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3"><div className="text-xl font-bold text-amber-400">{upcomingTasks.length}</div><div className="mt-1 text-xs text-slate-500">本週到期</div></div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3"><div className="text-xl font-bold text-slate-200">{riskProjects.length}</div><div className="mt-1 text-xs text-slate-500">風險專案</div></div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-6">
          <h2 className="text-sm font-semibold tracking-wide text-slate-200">立即處理</h2>
          <TaskSection title="逾期任務" count={overdueTasks.length} tasks={overdueTasks} projects={projects} overdue onComplete={(id) => setStatus(id, '已完成')} empty="沒有逾期任務。" />
          <TaskSection title="進行中工作" count={inProgressTasks.length} tasks={inProgressTasks} projects={projects} onComplete={(id) => setStatus(id, '已完成')} empty="目前沒有進行中的任務。" />
        </div>

        <div className="min-w-0 space-y-6">
          <h2 className="text-sm font-semibold tracking-wide text-slate-200">接下來</h2>
          <TaskSection title="今天與本週到期" count={upcomingTasks.length} tasks={upcomingTasks} projects={projects} onComplete={(id) => setStatus(id, '已完成')} empty="本週沒有即將到期的任務。" />
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">專案風險<span className="ml-2 font-normal normal-case text-slate-600">{riskProjects.length} 個</span></h3>
            {riskProjects.length === 0 ? <p className="py-2 text-sm text-slate-500">沒有近期需要留意的專案節點。</p> : <div className="space-y-2">{riskProjects.map((project) => <ProjectRiskCard key={project.id} project={project} today={today} weekEnd={weekEnd} onOpen={() => onOpenProject(project.id)} />)}</div>}
          </section>
          <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div><h3 className="text-sm font-medium text-slate-200">之後任務</h3><p className="mt-1 text-xs text-slate-500">{laterTasks.length} 件尚未排入本週優先清單</p></div>
              <CalendarDays size={16} className="shrink-0 text-slate-600" aria-hidden="true" />
            </div>
            {laterTasks.length > 0 && <div className="mt-3 space-y-1 text-sm text-slate-400">{limitTaskPreview(laterTasks, 3).map((task) => <div key={task.id} className="flex items-center justify-between gap-3"><span className="truncate">{task.title}</span><span className="shrink-0 text-xs text-slate-600">{task.dueDate ?? '無到期日'}</span></div>)}</div>}
            <button type="button" onClick={onOpenTasks} className="mt-3 text-sm text-primary-400 transition-colors hover:text-primary-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400">查看全部任務 →</button>
          </section>
        </div>
      </div>
    </div>
  );
}
