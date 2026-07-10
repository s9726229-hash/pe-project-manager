import { Flame } from 'lucide-react';
import type { useTasks } from '../hooks/useTasks';
import type { useProjects } from '../hooks/useProjects';
import type { useCases } from '../hooks/useCases';
import type { usePrograms } from '../hooks/usePrograms';
import type { Project } from '../types';
import { DEFAULT_PROJECT_ID } from '../hooks/useProjects';
import { flattenTaskLeaves } from '../services/taskUtils';
import { isCaseDone } from '../services/caseUtils';
import { computeProgressPercent, flattenLeaves, getCurrentStage, getNextMilestoneDate } from '../services/milestoneUtils';

interface DashboardProps {
  tasksApi: ReturnType<typeof useTasks>;
  projectsApi: ReturnType<typeof useProjects>;
  casesApi: ReturnType<typeof useCases>;
  programsApi: ReturnType<typeof usePrograms>;
  onOpenProject: (projectId: string) => void;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// 大專案底下的多個小專案合併算整體進度：把所有小專案的葉節點放在一起算完成比例。
function computeCombinedProgress(projects: Project[]): number {
  const leaves = projects.flatMap((p) => flattenLeaves(p.milestones));
  if (leaves.length === 0) return 0;
  const done = leaves.filter((l) => l.status === '已完成').length;
  return Math.round((done / leaves.length) * 100);
}

function combinedNextMilestoneDate(projects: Project[]): string | undefined {
  const dates = projects.map((p) => getNextMilestoneDate(p.milestones)).filter((d): d is string => !!d);
  return dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : undefined;
}

export default function Dashboard({ tasksApi, projectsApi, casesApi, programsApi, onOpenProject }: DashboardProps) {
  const { tasks } = tasksApi;
  const { projects } = projectsApi;
  const { cases } = casesApi;
  const { programs } = programsApi;
  const projectById = new Map(projects.map((p) => [p.id, p]));

  const today = todayIso();
  const todayTasks = flattenTaskLeaves(tasks)
    .filter((t) => t.dueDate && t.dueDate <= today && t.status !== '已完成')
    .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1));

  const openCases = cases.filter((c) => !isCaseDone(c));

  // 進行中專案卡片：有掛大專案的小專案合併成一張卡（顯示整體進度），沒掛的各自一張。
  const activeProjects = projects.filter((p) => p.status === '進行中' && p.id !== DEFAULT_PROJECT_ID);
  const programCards = programs
    .map((program) => ({ program, items: activeProjects.filter((p) => p.programId === program.id) }))
    .filter((g) => g.items.length > 0);
  const standaloneProjects = activeProjects.filter((p) => !p.programId || !programs.some((pg) => pg.id === p.programId));

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
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
                <span className={`text-xs shrink-0 ${t.dueDate! < today ? 'text-red-400' : 'text-slate-500'}`}>{t.dueDate}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-300">未結案問題/ECN案件</h2>
            <span className="text-xs text-slate-500">{openCases.length} 件</span>
          </div>

          {openCases.length === 0 && <p className="text-slate-500 text-sm">目前沒有未結案的案件。</p>}

          <div className="space-y-1">
            {openCases.slice(0, 8).map((c) => (
              <div key={c.id} className="flex items-center gap-2 text-sm py-1">
                <span className="flex-1 truncate">{c.name}</span>
                <span className="text-xs text-slate-500 shrink-0">{projectById.get(c.projectId)?.name ?? '—'}</span>
                <span className="text-xs text-slate-500 shrink-0">{c.caseTypeLabel}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <h2 className="text-sm font-semibold text-slate-300 mb-3">進行中專案</h2>

      {programCards.length === 0 && standaloneProjects.length === 0 && (
        <p className="text-slate-500 text-sm">目前沒有進行中的專案。</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 大專案卡片：旗下小專案合併顯示 */}
        {programCards.map(({ program, items }) => {
          const progress = computeCombinedProgress(items);
          const nextDate = combinedNextMilestoneDate(items);
          return (
            <div key={program.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{program.name}</span>
                <span className="text-xs text-slate-500">{items.length} 個小專案</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-primary-500 rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                <span>整體進度 {progress}%</span>
                {nextDate && <span>下個里程碑 {nextDate}</span>}
              </div>
              <div className="space-y-1">
                {items.map((p) => {
                  const stage = getCurrentStage(p.milestones);
                  return (
                    <button
                      key={p.id}
                      onClick={() => onOpenProject(p.id)}
                      className="w-full flex items-center gap-2 text-sm py-1 px-2 rounded hover:bg-slate-800 text-left"
                    >
                      <span className="flex-1 truncate">{p.name}</span>
                      <span className="text-xs text-slate-500 shrink-0">{stage?.name ?? '—'}</span>
                      <span className="text-xs text-slate-500 shrink-0">{computeProgressPercent(p.milestones)}%</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* 未掛大專案的獨立小專案卡片 */}
        {standaloneProjects.map((p) => {
          const stage = getCurrentStage(p.milestones);
          const progress = computeProgressPercent(p.milestones);
          const nextDate = getNextMilestoneDate(p.milestones);
          return (
            <button
              key={p.id}
              onClick={() => onOpenProject(p.id)}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-left hover:border-slate-600"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{p.name}</span>
                <span className="text-xs text-slate-500">{stage?.name ?? '—'}</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-primary-500 rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>進度 {progress}%</span>
                {nextDate && <span>下個里程碑 {nextDate}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
