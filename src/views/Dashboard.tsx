import { useState } from 'react';
import { AlertTriangle, Check, Flame } from 'lucide-react';
import type { useProjects } from '../hooks/useProjects';
import type { usePrograms } from '../hooks/usePrograms';
import type { useTasks } from '../hooks/useTasks';
import { DEFAULT_PROJECT_ID } from '../hooks/useProjects';
import type { Project, Task } from '../types';
import { flattenLeaves } from '../services/milestoneUtils';
import {
  getInProgressTaskLeaves,
  getDashboardTaskLeaves,
  getOverdueTaskLeaves,
  getPendingTaskLeaves,
  getTaskProjectName,
  getUpcomingTaskLeaves,
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

type TaskTabId = 'overdue' | 'todo' | 'inProgress' | 'later';

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
  return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日 星期${weekdays[date.getDay()]}`;
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
    <button type="button" onClick={onOpen} className="w-full rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-left transition-colors hover:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400">
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

function TaskWorkbenchRow({ task, projects, overdue, today, onComplete }: {
  task: Task;
  projects: Project[];
  overdue?: boolean;
  today: string;
  onComplete: () => void;
}) {
  const projectName = getTaskProjectName(task, projects);
  const showProjectName = task.projectId !== DEFAULT_PROJECT_ID && projectName !== '日常雜項';
  const overdueDays = overdue && task.dueDate
    ? Math.round((new Date(`${today}T00:00:00`).getTime() - new Date(`${task.dueDate}T00:00:00`).getTime()) / 86_400_000)
    : 0;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
      <button type="button" aria-label={`完成 ${task.title}`} onClick={onComplete} className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-700 text-emerald-400 transition-colors hover:border-emerald-500 hover:bg-emerald-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400">
        <Check size={12} aria-hidden="true" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2 text-xs">
          <span className="min-w-0 flex-1 break-words text-sm text-slate-200">{task.title}</span>
          <span className={overdue ? 'shrink-0 text-red-400' : 'shrink-0 text-slate-500'}>{task.dueDate ?? '未設定期限'}</span>
          {overdueDays > 0 && <span className="shrink-0 text-red-400">逾期 {overdueDays} 天</span>}
          {task.urgent && <span aria-label="緊急" className="flex shrink-0 items-center gap-1 text-red-400"><Flame size={12} aria-hidden="true" />緊急</span>}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
          {showProjectName && <span>{projectName}</span>}
        </div>
      </div>
    </div>
  );
}

function TaskSection({ title, tasks, projects, overdue, today, showCount = true, onComplete, empty }: {
  title: string;
  tasks: Task[];
  projects: Project[];
  overdue?: boolean;
  today: string;
  showCount?: boolean;
  onComplete: (id: string) => void;
  empty: string;
}) {
  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{title}{showCount && <span className="ml-2 font-normal normal-case text-slate-600">{tasks.length} 件</span>}</h3>
      {tasks.length === 0 ? <p className="py-2 text-sm text-slate-500">{empty}</p> : <div className="space-y-2">{tasks.map((task) => <TaskWorkbenchRow key={task.id} task={task} projects={projects} overdue={overdue} today={today} onComplete={() => onComplete(task.id)} />)}</div>}
    </section>
  );
}

export default function Dashboard({ tasksApi, projectsApi, onOpenProject, onOpenTasks }: DashboardProps) {
  const { tasks, setStatus } = tasksApi;
  const { projects } = projectsApi;
  const [activeTaskTab, setActiveTaskTab] = useState<TaskTabId>('overdue');
  const today = todayIso();
  const weekEnd = addDays(startOfWeek(today), 6);
  const dashboardTasks = getDashboardTaskLeaves(tasks);
  const overdueTasks = sortTasksByDueDate(getOverdueTaskLeaves(dashboardTasks, today));
  const inProgressTasks = sortTasksByDueDate(
    getInProgressTaskLeaves(dashboardTasks).filter((task) => !task.dueDate || task.dueDate >= today)
  );
  const todoTasks = sortTasksByDueDate(getUpcomingTaskLeaves(dashboardTasks, today, weekEnd));
  const laterTasks = sortTasksByDueDate(getPendingTaskLeaves(dashboardTasks).filter((task) => !!task.dueDate && task.dueDate > weekEnd));
  const activeProjects = projects.filter((project) => project.id !== DEFAULT_PROJECT_ID && project.status !== '取消' && project.status !== '已完成');
  const riskProjects = activeProjects.filter((project) => flattenLeaves(project.milestones).some((milestone) => milestone.status !== '已完成' && milestone.plannedDate && milestone.plannedDate <= weekEnd));
  const taskTabs: Array<{ id: TaskTabId; label: string; tasks: Task[]; overdue?: boolean; empty: string }> = [
    { id: 'overdue', label: `延遲 ${overdueTasks.length}`, tasks: overdueTasks, overdue: true, empty: '目前沒有延遲任務。' },
    { id: 'todo', label: '待辦', tasks: todoTasks, empty: '今天與本週沒有待辦任務。' },
    { id: 'inProgress', label: '進行中', tasks: inProgressTasks, empty: '目前沒有進行中的任務。' },
    { id: 'later', label: '尚未啟動', tasks: laterTasks, empty: '本週後沒有待啟動的任務。' },
  ];
  const selectedTaskTab = taskTabs.find((tab) => tab.id === activeTaskTab) ?? taskTabs[0];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4"><div><h1 className="text-2xl font-bold tracking-tight text-slate-100">儀表板</h1><p className="mt-0.5 text-sm text-slate-500">聚焦今天的任務與專案風險。</p></div><span className="shrink-0 text-xs font-mono tabular-nums text-slate-600">{formatDateChinese(today)}</span></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3"><div className="text-xl font-bold text-red-400">{overdueTasks.length}</div><div className="mt-1 text-xs text-slate-500">延遲任務</div></div>
        <div className="rounded-xl border border-primary-400/20 bg-primary-400/5 p-3"><div className="text-xl font-bold text-primary-400">{inProgressTasks.length}</div><div className="mt-1 text-xs text-slate-500">進行中工作</div></div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3"><div className="text-xl font-bold text-amber-400">{todoTasks.length}</div><div className="mt-1 text-xs text-slate-500">本週待辦</div></div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3"><div className="text-xl font-bold text-slate-200">{riskProjects.length}</div><div className="mt-1 text-xs text-slate-500">有風險專案</div></div>
      </div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-6">
          <h2 className="text-sm font-semibold tracking-wide text-slate-200">立即處理</h2>
          <div role="tablist" aria-label="任務分類" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {taskTabs.map((tab) => <button key={tab.id} id={`dashboard-task-tab-${tab.id}`} type="button" role="tab" aria-selected={tab.id === activeTaskTab} aria-controls="dashboard-task-panel" onClick={() => setActiveTaskTab(tab.id)} className={`rounded-lg border px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${tab.id === activeTaskTab ? 'border-primary-400/50 bg-primary-400/10 text-primary-300' : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'}`}>{tab.label}{tab.id !== 'overdue' && <span className="ml-1 text-xs opacity-70">{tab.tasks.length}</span>}</button>)}
          </div>
          <div id="dashboard-task-panel" role="tabpanel" aria-labelledby={`dashboard-task-tab-${selectedTaskTab.id}`} tabIndex={0}>
            <TaskSection title={selectedTaskTab.label} tasks={selectedTaskTab.tasks} projects={projects} overdue={selectedTaskTab.overdue} today={today} showCount={selectedTaskTab.id !== 'overdue'} onComplete={(id) => setStatus(id, '已完成')} empty={selectedTaskTab.empty} />
          </div>
        </div>
        <div className="min-w-0 space-y-6">
          <h2 className="text-sm font-semibold tracking-wide text-slate-200">專案狀態</h2>
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">專案風險<span className="ml-2 font-normal normal-case text-slate-600">{riskProjects.length} 個</span></h3>
            {riskProjects.length === 0 ? <p className="py-2 text-sm text-slate-500">目前沒有本週需要留意的專案風險。</p> : <div className="space-y-2">{riskProjects.map((project) => <ProjectRiskCard key={project.id} project={project} today={today} weekEnd={weekEnd} onOpen={() => onOpenProject(project.id)} />)}</div>}
          </section>
          <button type="button" onClick={onOpenTasks} className="text-sm text-primary-400 transition-colors hover:text-primary-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400">查看全部任務 →</button>
        </div>
      </div>
    </div>
  );
}
