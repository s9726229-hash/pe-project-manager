import { useState } from 'react';
import { AlertCircle, AlertTriangle, CalendarDays, Check, Clock, Flame, FolderKanban, Plus } from 'lucide-react';
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

function todayIso(): string { return new Date().toISOString().slice(0, 10); }

function formatDateChinese(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日　週${weekdays[d.getDay()]}`;
}

function addDays(iso: string, n: number) {
  const d = new Date(iso); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10);
}
function startOfWeek(iso: string) {
  const d = new Date(iso); const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1)); return d.toISOString().slice(0, 10);
}

type Bucket = 'overdue' | 'today' | 'week' | 'later' | 'none';
const BUCKET_META: Record<Bucket, { label: string; textColor: string; wrapClass: string }> = {
  overdue: { label: '逾期',   textColor: 'text-red-400',    wrapClass: 'bg-red-500/8 border border-red-500/20 rounded-lg p-3' },
  today:   { label: '今天',   textColor: 'text-amber-400',  wrapClass: 'bg-amber-500/8 border border-amber-500/20 rounded-lg p-3' },
  week:    { label: '本週',   textColor: 'text-sky-400',    wrapClass: 'px-1' },
  later:   { label: '之後',   textColor: 'text-slate-400',  wrapClass: 'px-1' },
  none:    { label: '無期限', textColor: 'text-slate-500',  wrapClass: 'px-1' },
};
const BUCKET_ORDER: Bucket[] = ['overdue', 'today', 'week', 'later', 'none'];

function getBucket(dueDate: string | undefined, today: string, weekEnd: string): Bucket {
  if (!dueDate) return 'none';
  if (dueDate < today) return 'overdue';
  if (dueDate === today) return 'today';
  if (dueDate <= weekEnd) return 'week';
  return 'later';
}

function countOverdueMilestones(projects: Project[], today: string): number {
  return projects.flatMap((p) => flattenLeaves(p.milestones))
    .filter((l) => l.status !== '已完成' && l.plannedDate && l.plannedDate < today).length;
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

// ── KPI Tile ──────────────────────────────────────────────────────────────────
interface KpiTileProps {
  label: string;
  value: number;
  icon: typeof AlertCircle;
  colorClass: string;
  alertWhenPositive?: boolean;
}
function KpiTile({ label, value, icon: Icon, colorClass, alertWhenPositive }: KpiTileProps) {
  const active = alertWhenPositive && value > 0;
  return (
    <div className={`bg-slate-900/60 border rounded-xl p-4 transition-colors ${active ? 'border-current/30' : 'border-slate-800'}`}
      style={active ? { borderColor: 'var(--tw-border-opacity,1)' } : undefined}>
      <div className="flex items-start justify-between mb-3">
        <span className={`text-3xl font-bold tracking-tight ${active ? colorClass : 'text-slate-100'}`}>
          {value}
        </span>
        <Icon size={16} className={active ? colorClass : 'text-slate-600'} />
      </div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Dashboard({ tasksApi, projectsApi, programsApi, onOpenProject }: DashboardProps) {
  const { tasks, setStatus, addTask } = tasksApi;
  const { projects } = projectsApi;
  const { programs } = programsApi;

  const [quickTitle, setQuickTitle] = useState('');

  function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;
    addTask({ projectId: DEFAULT_PROJECT_ID, title, dueDate: todayIso() });
    setQuickTitle('');
  }

  const today   = todayIso();
  const weekEnd = addDays(startOfWeek(today), 6);

  // 待辦分 bucket
  const pendingTasks = flattenTaskLeaves(tasks)
    .filter((t) => t.status !== '已完成')
    .sort((a, b) => ((a.dueDate ?? '9999') < (b.dueDate ?? '9999') ? -1 : 1));

  const buckets: Record<Bucket, typeof pendingTasks> = { overdue: [], today: [], week: [], later: [], none: [] };
  for (const t of pendingTasks) buckets[getBucket(t.dueDate, today, weekEnd)].push(t);

  // 專案
  const visibleProjects = projects.filter(
    (p) => p.id !== DEFAULT_PROJECT_ID && p.status !== '取消' && p.status !== '已完成'
  );
  const programCards = programs
    .map((program) => ({ program, items: visibleProjects.filter((p) => p.programId === program.id) }))
    .filter((g) => g.items.length > 0);
  const programIds = new Set(programs.map((pg) => pg.id));
  const standaloneProjects = visibleProjects.filter((p) => !p.programId || !programIds.has(p.programId));

  // KPI 數據
  const overdueTasks  = buckets.overdue.length;
  const todayTasks    = buckets.today.length;
  const weekTasks     = buckets.week.length;

  // 摘要句
  const summaryParts: string[] = [];
  if (overdueTasks > 0) summaryParts.push(`${overdueTasks} 件逾期`);
  if (todayTasks > 0)   summaryParts.push(`${todayTasks} 件今日待辦`);
  if (visibleProjects.length > 0) summaryParts.push(`${visibleProjects.length} 個進行中專案`);

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">儀表板</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {summaryParts.length > 0 ? summaryParts.join('　·　') : '目前沒有待辦事項'}
          </p>
        </div>
        <span className="text-xs text-slate-600 font-mono tabular-nums">{formatDateChinese(today)}</span>
      </div>

      {/* ── KPI 列 ── */}
      <div className="grid grid-cols-4 gap-3">
        <KpiTile label="逾期任務"    value={overdueTasks}      icon={AlertCircle}  colorClass="text-red-400"     alertWhenPositive />
        <KpiTile label="今日待辦"    value={todayTasks}        icon={Clock}        colorClass="text-amber-400"   alertWhenPositive />
        <KpiTile label="進行中專案"  value={visibleProjects.length} icon={FolderKanban} colorClass="text-primary-400" />
        <KpiTile label="本週到期"    value={weekTasks}         icon={CalendarDays} colorClass="text-sky-400" />
      </div>

      {/* ── 主內容：左右欄 ── */}
      <div className="flex gap-6 items-start">

        {/* ── 左欄：待辦 ── */}
        <div className="w-72 shrink-0">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            待辦事項
            <span className="ml-2 text-slate-600 font-normal normal-case">{pendingTasks.length} 件</span>
          </h2>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-3 space-y-2">
              {pendingTasks.length === 0 && (
                <p className="text-slate-500 text-sm py-2">目前沒有待辦事項。</p>
              )}

              {BUCKET_ORDER.filter((b) => buckets[b].length > 0).map((b) => (
                <div key={b} className={BUCKET_META[b].wrapClass}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[11px] font-semibold ${BUCKET_META[b].textColor}`}>
                      {BUCKET_META[b].label}
                    </span>
                    <span className="text-[11px] text-slate-600">{buckets[b].length}</span>
                  </div>
                  <div className="space-y-1">
                    {buckets[b].map((t) => (
                      <div key={t.id} className="flex items-center gap-2 py-0.5 group/row">
                        <button
                          onClick={() => setStatus(t.id, '已完成')}
                          className="w-4 h-4 rounded-full border border-slate-700 shrink-0 flex items-center justify-center hover:border-emerald-500 hover:bg-emerald-500/10 transition-colors group-hover/row:border-slate-500"
                        >
                          <Check size={10} className="text-emerald-400 opacity-0 group-hover/row:opacity-50 transition-opacity" />
                        </button>
                        {t.urgent && <Flame size={12} className="text-red-400 shrink-0" />}
                        <span className="flex-1 truncate text-sm text-slate-300">{t.title}</span>
                        <span className={`text-[11px] shrink-0 tabular-nums ${b === 'overdue' ? 'text-red-400' : 'text-slate-600'}`}>
                          {t.dueDate?.slice(5) ?? '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 快速新增 */}
            <form onSubmit={handleQuickAdd} className="border-t border-slate-800 flex items-center gap-2 px-3 py-2.5">
              <Plus size={13} className="text-slate-600 shrink-0" />
              <input
                className="flex-1 bg-transparent text-sm text-slate-300 placeholder-slate-600 outline-none"
                placeholder="快速新增待辦..."
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
              />
            </form>
          </div>
        </div>

        {/* ── 右欄：專案進度 ── */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            專案進度
            <span className="ml-2 text-slate-600 font-normal normal-case">{visibleProjects.length} 個</span>
          </h2>

          {visibleProjects.length === 0 && (
            <p className="text-slate-500 text-sm">目前沒有進行中或暫停的專案。</p>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">

            {/* Program 群組卡 */}
            {programCards.map(({ program, items }) => {
              const progress = computeCombinedProgress(items);
              const nextDate = combinedNextMilestoneDate(items);
              const overdueCount = countOverdueMilestones(items, today);
              return (
                <div key={program.id} className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors">
                  {/* 卡片 Header */}
                  <div className="px-4 pt-4 pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-100 truncate">{program.name}</span>
                      <span className="text-xs text-slate-500 shrink-0 ml-2">{items.length} 個子專案</span>
                    </div>
                    {/* 進度條 */}
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden my-2">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${progress}%`,
                          background: 'linear-gradient(90deg, #6366f1, #818cf8)'
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">{progress}%</span>
                      {nextDate && <span className="text-slate-600">↗ {nextDate}</span>}
                    </div>
                    {overdueCount > 0 && (
                      <div className="flex items-center gap-1 text-xs text-red-400 mt-2">
                        <AlertTriangle size={11} />
                        <span>{overdueCount} 個里程碑逾期</span>
                      </div>
                    )}
                  </div>
                  {/* 子專案列表 */}
                  <div className="border-t border-slate-800/80">
                    {items.map((p) => {
                      const stage = getCurrentStage(p.milestones);
                      const pct = computeProgressPercent(p.milestones);
                      return (
                        <button
                          key={p.id}
                          onClick={() => onOpenProject(p.id)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/60 text-left group border-b border-slate-800/60 last:border-0 transition-colors"
                        >
                          {/* mini 進度條 */}
                          <div className="w-1 h-8 bg-slate-800 rounded-full overflow-hidden shrink-0">
                            <div
                              className="rounded-full transition-all"
                              style={{ height: `${pct}%`, background: 'linear-gradient(180deg, #818cf8, #6366f1)' }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-slate-200 group-hover:text-white truncate">{p.name}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{stage?.name ?? '—'}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-semibold text-slate-300">{pct}%</div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${STATUS_STYLE[p.status]}`}>
                              {p.status}
                            </span>
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
              const overdueCount = countOverdueMilestones([p], today);
              return (
                <button
                  key={p.id}
                  onClick={() => onOpenProject(p.id)}
                  className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-left hover:border-slate-700 transition-colors group"
                >
                  {/* 標題 + 狀態 */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="font-semibold text-slate-100 group-hover:text-white leading-snug">{p.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${STATUS_STYLE[p.status]}`}>
                      {p.status}
                    </span>
                  </div>
                  {/* 進度 */}
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: 'linear-gradient(90deg, #6366f1, #818cf8)'
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-400 font-medium">{pct}% 完成</span>
                    {stage && (
                      <span className="text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                        {stage.name}
                      </span>
                    )}
                  </div>
                  {overdueCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-red-400 mb-1.5">
                      <AlertTriangle size={11} />
                      <span>{overdueCount} 個里程碑逾期</span>
                    </div>
                  )}
                  {nextDate && (
                    <div className="text-xs text-slate-600 pt-2 border-t border-slate-800">
                      ↗ 下一里程碑 <span className="text-slate-500">{nextDate}</span>
                    </div>
                  )}
                </button>
              );
            })}

          </div>
        </div>

      </div>
    </div>
  );
}
