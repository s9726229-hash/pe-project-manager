import { Flame } from 'lucide-react';
import type { useTasks } from '../hooks/useTasks';
import type { useProjects } from '../hooks/useProjects';
import type { usePrograms } from '../hooks/usePrograms';
import type { Project } from '../types';
import { DEFAULT_PROJECT_ID } from '../hooks/useProjects';
import { flattenTaskLeaves } from '../services/taskUtils';
import { computeProgressPercent, flattenLeaves, getCurrentStage, getNextMilestoneDate } from '../services/milestoneUtils';

interface DashboardProps {
  tasksApi: ReturnType<typeof useTasks>;
  projectsApi: ReturnType<typeof useProjects>;
  casesApi: unknown;
  programsApi: ReturnType<typeof usePrograms>;
  onOpenProject: (projectId: string) => void;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

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

const STATUS_STYLE: Record<string, string> = {
  '進行中': 'text-primary-400 bg-primary-400/10 border-primary-400/30',
  '暫停':   'text-amber-400  bg-amber-400/10  border-amber-400/30',
  '取消':   'text-slate-500  bg-slate-800     border-slate-700',
  '已完成': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
};

export default function Dashboard({ tasksApi, projectsApi, programsApi, onOpenProject }: DashboardProps) {
  const { tasks } = tasksApi;
  const { projects } = projectsApi;
  const { programs } = programsApi;

  const today = todayIso();
  const twoWeeksOut = addDays(today, 14);

  // ── 待辦 ──
  const pendingTasks = flattenTaskLeaves(tasks)
    .filter((t) => t.dueDate && t.status !== '已完成')
    .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1));
  const todayTasks    = pendingTasks.filter((t) => t.dueDate! <= today);
  const upcomingTasks = pendingTasks.filter((t) => t.dueDate! > today);

  // ── 近期里程碑（14 天內，未完成） ──
  const activeForMilestones = projects.filter((p) => p.id !== DEFAULT_PROJECT_ID && p.status !== '取消' && p.status !== '已完成');
  interface MilestoneHit { projectName: string; milestoneName: string; date: string; overdue: boolean; }
  const upcomingMilestones: MilestoneHit[] = activeForMilestones
    .flatMap((p) =>
      flattenLeaves(p.milestones)
        .filter((l) => l.status !== '已完成' && l.plannedDate && l.plannedDate <= twoWeeksOut)
        .map((l) => ({
          projectName: p.name,
          milestoneName: l.name,
          date: l.plannedDate!,
          overdue: l.plannedDate! < today,
        }))
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  // ── 專案卡片：顯示 進行中 + 暫停，不含 取消/已完成 ──
  const visibleProjects = projects.filter(
    (p) => p.id !== DEFAULT_PROJECT_ID && p.status !== '取消' && p.status !== '已完成'
  );

  // Program 群組
  const programCards = programs
    .map((program) => ({ program, items: visibleProjects.filter((p) => p.programId === program.id) }))
    .filter((g) => g.items.length > 0);

  // 獨立專案（沒有掛 program 或掛的 program 已不存在）
  const programIds = new Set(programs.map((pg) => pg.id));
  const standaloneProjects = visibleProjects.filter((p) => !p.programId || !programIds.has(p.programId));

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>

      {/* ── 上方兩欄：待辦 + 近期里程碑 ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">

        {/* 今日待辦 */}
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

          {upcomingTasks.length > 0 && (
            <>
              <div className="flex items-center justify-between mt-4 mb-1 pt-3 border-t border-slate-800">
                <h3 className="text-xs font-semibold text-slate-400">尚未到期</h3>
                <span className="text-xs text-slate-500">{upcomingTasks.length} 件</span>
              </div>
              <div className="space-y-1">
                {upcomingTasks.slice(0, 8).map((t) => (
                  <div key={t.id} className="flex items-center gap-2 text-sm py-1 text-slate-400">
                    {t.urgent && <Flame size={13} className="text-red-400 shrink-0" />}
                    <span className="flex-1 truncate">{t.title}</span>
                    <span className="text-xs shrink-0 text-slate-500">{t.dueDate}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 近期里程碑 */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-300">近期里程碑</h2>
            <span className="text-xs text-slate-500">14 天內</span>
          </div>

          {upcomingMilestones.length === 0 && <p className="text-slate-500 text-sm">未來 14 天沒有到期里程碑。</p>}

          <div className="space-y-1">
            {upcomingMilestones.slice(0, 10).map((m, i) => (
              <div key={i} className="flex items-start gap-2 text-sm py-1">
                <span className={`text-xs shrink-0 mt-0.5 font-mono ${m.overdue ? 'text-red-400' : 'text-slate-500'}`}>{m.date}</span>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-slate-200">{m.milestoneName}</div>
                  <div className="text-xs text-slate-500 truncate">{m.projectName}</div>
                </div>
                {m.overdue && <span className="text-xs text-red-400 shrink-0">逾期</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 專案卡片 ── */}
      <h2 className="text-sm font-semibold text-slate-300 mb-3">
        專案進度
        <span className="ml-2 text-slate-600 font-normal text-xs">{visibleProjects.length} 個</span>
      </h2>

      {visibleProjects.length === 0 && (
        <p className="text-slate-500 text-sm">目前沒有進行中或暫停的專案。</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Program 群組卡 */}
        {programCards.map(({ program, items }) => {
          const progress = computeCombinedProgress(items);
          const nextDate = combinedNextMilestoneDate(items);
          return (
            <div key={program.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-slate-100">{program.name}</span>
                <span className="text-xs text-slate-500">{items.length} 個子專案</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1">
                <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                <span>整體 {progress}%</span>
                {nextDate && <span>下一里程碑 {nextDate}</span>}
              </div>
              <div className="space-y-1 border-t border-slate-800 pt-2">
                {items.map((p) => {
                  const stage = getCurrentStage(p.milestones);
                  const pct = computeProgressPercent(p.milestones);
                  return (
                    <button
                      key={p.id}
                      onClick={() => onOpenProject(p.id)}
                      className="w-full flex items-center gap-2 text-sm py-1.5 px-2 rounded hover:bg-slate-800 text-left group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-slate-200 group-hover:text-white">{p.name}</div>
                        <div className="text-xs text-slate-500">{stage?.name ?? '—'}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs text-slate-400">{pct}%</div>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full border ${STATUS_STYLE[p.status]}`}>{p.status}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* 獨立專案：各自一張卡 */}
        {standaloneProjects.map((p) => {
          const stage = getCurrentStage(p.milestones);
          const pct = computeProgressPercent(p.milestones);
          const nextDate = getNextMilestoneDate(p.milestones);
          return (
            <button
              key={p.id}
              onClick={() => onOpenProject(p.id)}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-left hover:border-slate-600 transition-colors group"
            >
              <div className="flex items-start justify-between mb-3 gap-2">
                <span className="font-medium text-slate-100 group-hover:text-white leading-snug">{p.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${STATUS_STYLE[p.status]}`}>{p.status}</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1">
                <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{pct}% 完成</span>
                <span className="text-slate-600">{stage?.name ?? '—'}</span>
              </div>
              {nextDate && (
                <div className="mt-2 pt-2 border-t border-slate-800 text-xs text-slate-500">
                  下一里程碑 <span className="text-slate-400">{nextDate}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
