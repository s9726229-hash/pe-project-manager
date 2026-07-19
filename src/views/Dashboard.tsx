import { useState } from 'react';
import { AlertCircle, AlertTriangle, CalendarDays, Check, ChevronDown, ChevronRight, Clock, Flame, FolderKanban, Plus } from 'lucide-react';
import type { useTasks } from '../hooks/useTasks';
import type { useProjects } from '../hooks/useProjects';
import type { usePrograms } from '../hooks/usePrograms';
import type { Project, Task } from '../types';
import { DEFAULT_PROJECT_ID } from '../hooks/useProjects';
import { isParentTask } from '../services/taskUtils';
import { getInProgressTaskLeaves, getPendingTaskLeaves, sortTasksByDueDate } from '../services/taskSelectors';
import { computeProgressPercent, flattenLeaves, getCurrentStage, getNextMilestoneDate } from '../services/milestoneUtils';
import InProgressTaskList from '../components/tasks/InProgressTaskList';

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
  later:   { label: '之後',   textColor: 'text-slate-400',  wrapClass: 'bg-slate-800/40 border border-slate-700/50 rounded-lg p-3' },
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

interface RenderGroup { groupKey: string; parentTitle?: string; items: Task[]; }

function buildRenderGroups(bucketTasks: Task[], allTasks: Task[]): RenderGroup[] {
  const leafToParent = new Map<string, { id: string; title: string }>();
  for (const t of allTasks) {
    if (isParentTask(t)) {
      for (const sub of t.subTasks!) leafToParent.set(sub.id, { id: t.id, title: t.title });
    }
  }
  const groupOrder: string[] = [];
  const groupMap = new Map<string, { parentTitle?: string; items: Task[] }>();
  for (const leaf of bucketTasks) {
    const parent = leafToParent.get(leaf.id);
    const key = parent?.id ?? leaf.id;
    if (!groupMap.has(key)) { groupOrder.push(key); groupMap.set(key, { parentTitle: parent?.title, items: [] }); }
    groupMap.get(key)!.items.push(leaf);
  }
  return groupOrder.map((key) => ({ groupKey: key, ...groupMap.get(key)! }));
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
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());

  function toggleProgram(id: string) {
    setExpandedPrograms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

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
  const pendingTasks = sortTasksByDueDate(getPendingTaskLeaves(tasks));
  const inProgressTasks = sortTasksByDueDate(getInProgressTaskLeaves(tasks));

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
      <div className="grid grid-cols-5 gap-3">
        <KpiTile label="逾期任務"    value={overdueTasks}      icon={AlertCircle}  colorClass="text-red-400"     alertWhenPositive />
        <KpiTile label="今日待辦"    value={todayTasks}        icon={Clock}        colorClass="text-amber-400"   alertWhenPositive />
        <KpiTile label="進行中專案"  value={visibleProjects.length} icon={FolderKanban} colorClass="text-primary-400" />
        <KpiTile label="本週到期"    value={weekTasks}         icon={CalendarDays} colorClass="text-sky-400" />
        <KpiTile label="進行中工作"  value={inProgressTasks.length} icon={Flame} colorClass="text-primary-400" />
      </div>

      {/* ── 主內容：左右欄（待辦 1/3、專案 2/3） ── */}
      <div className="grid grid-cols-3 gap-6 items-start">

        {/* ── 左欄：待辦 ── */}
        <div>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            進行中工作
            <span className="ml-2 text-slate-600 font-normal normal-case">{inProgressTasks.length} 件</span>
          </h2>
          <InProgressTaskList
            tasks={inProgressTasks}
            projects={projects}
            onComplete={(id) => setStatus(id, '已完成')}
          />

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
                  <div className="space-y-1.5">
                    {buildRenderGroups(buckets[b], tasks).map((group) => (
                      <div key={group.groupKey}>
                        {group.parentTitle && (
                          <div className="flex items-center gap-1.5 mt-1 mb-0.5">
                            <div className="w-0.5 h-3 bg-slate-700 rounded-full shrink-0" />
                            <span className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase truncate">
                              {group.parentTitle}
                            </span>
                          </div>
                        )}
                        <div className="space-y-1">
                          {group.items.map((t) => (
                            <div key={t.id} className="flex items-start gap-2 py-0.5 group/row">
                              <button
                                onClick={() => setStatus(t.id, '已完成')}
                                className="w-4 h-4 mt-0.5 rounded-full border border-slate-700 shrink-0 flex items-center justify-center hover:border-emerald-500 hover:bg-emerald-500/10 transition-colors group-hover/row:border-slate-500"
                              >
                                <Check size={10} className="text-emerald-400 opacity-0 group-hover/row:opacity-50 transition-opacity" />
                              </button>
                              <div className="w-3 mt-1 shrink-0 flex items-center justify-center">
                                {t.urgent && <Flame size={11} className="text-red-400" />}
                              </div>
                              <span className="flex-1 text-sm text-slate-300 break-words line-clamp-2">{t.title}</span>
                              <span className={`text-[11px] mt-0.5 shrink-0 tabular-nums ${b === 'overdue' ? 'text-red-400' : 'text-slate-400'}`}>
                                {t.dueDate?.slice(5) ?? '—'}
                              </span>
                            </div>
                          ))}
                        </div>
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
        <div className="min-w-0 col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              專案進度
              <span className="ml-2 text-slate-600 font-normal normal-case">{visibleProjects.length} 個</span>
            </h2>
            {programCards.length > 0 && (
              <button
                onClick={() => setExpandedPrograms(
                  expandedPrograms.size === programCards.length
                    ? new Set()
                    : new Set(programCards.map((g) => g.program.id))
                )}
                className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
              >
                {expandedPrograms.size === programCards.length ? '全部收合' : '全部展開'}
              </button>
            )}
          </div>

          {visibleProjects.length === 0 && (
            <p className="text-slate-500 text-sm">目前沒有進行中或暫停的專案。</p>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Program 群組卡 */}
            {programCards.map(({ program, items }) => {
              const progress = computeCombinedProgress(items);
              const nextDate = combinedNextMilestoneDate(items);
              const overdueCount = countOverdueMilestones(items, today);
              const expanded = expandedPrograms.has(program.id);
              return (
                <div key={program.id} className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors">
                  {/* 卡片 Header（點擊展開/收合） */}
                  <button
                    onClick={() => toggleProgram(program.id)}
                    className="w-full px-4 pt-4 pb-3 text-left hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-100 truncate">
                        {expanded
                          ? <ChevronDown size={14} className="text-slate-400 shrink-0" />
                          : <ChevronRight size={14} className="text-slate-400 shrink-0" />}
                        {program.name}
                      </span>
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
                      {nextDate && <span className="text-slate-400">↗ {nextDate}</span>}
                    </div>
                    {overdueCount > 0 && (
                      <div className="flex items-center gap-1 text-xs text-red-400 mt-2">
                        <AlertTriangle size={11} />
                        <span>{overdueCount} 個里程碑逾期</span>
                      </div>
                    )}
                  </button>
                  {/* 子專案列表（展開時顯示） */}
                  {expanded && (
                    <div className="border-t border-slate-800/80">
                      {items.map((p) => {
                        const stage = getCurrentStage(p.milestones);
                        const pct = computeProgressPercent(p.milestones);
                        const pendingSubs = (stage?.subMilestones?.filter((s) => s.status !== '已完成') ?? [])
                          .sort((a, b) => ((a.plannedDate ?? '9999') < (b.plannedDate ?? '9999') ? -1 : 1));
                        const shownSubs = pendingSubs.slice(0, 2);
                        const moreCount = pendingSubs.length - shownSubs.length;
                        return (
                          <button
                            key={p.id}
                            onClick={() => onOpenProject(p.id)}
                            className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-slate-800/60 text-left group border-b border-slate-800/60 last:border-0 transition-colors"
                          >
                            {/* mini 進度條 */}
                            <div className="w-1 h-8 bg-slate-800 rounded-full overflow-hidden shrink-0 mt-0.5">
                              <div
                                className="rounded-full transition-all"
                                style={{ height: `${pct}%`, background: 'linear-gradient(180deg, #818cf8, #6366f1)' }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-slate-200 group-hover:text-white truncate">{p.name}</div>
                              <div className="text-xs text-slate-400 mt-0.5">{stage?.name ?? '—'}</div>
                              {shownSubs.length > 0 && (
                                <div className="mt-1 space-y-0.5">
                                  {shownSubs.map((s) => (
                                    <div key={s.id} className="flex items-center gap-1.5 text-xs text-slate-400">
                                      <div className="w-1 h-1 rounded-full bg-slate-600 shrink-0" />
                                      <span className="truncate">{s.name}</span>
                                      {s.plannedDate && <span className="shrink-0 text-slate-500">{s.plannedDate.slice(5)}</span>}
                                    </div>
                                  ))}
                                  {moreCount > 0 && (
                                    <div className="text-[11px] text-slate-500 pl-2.5">+{moreCount} 項</div>
                                  )}
                                </div>
                              )}
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
                  )}
                </div>
              );
            })}

            {/* 獨立專案：各自一張卡 */}
            {standaloneProjects.map((p) => {
              const stage = getCurrentStage(p.milestones);
              const pct = computeProgressPercent(p.milestones);
              const nextDate = getNextMilestoneDate(p.milestones);
              const overdueCount = countOverdueMilestones([p], today);
              const pendingSubs = (stage?.subMilestones?.filter((s) => s.status !== '已完成') ?? [])
                .sort((a, b) => ((a.plannedDate ?? '9999') < (b.plannedDate ?? '9999') ? -1 : 1));
              const shownSubs = pendingSubs.slice(0, 2);
              const moreCount = pendingSubs.length - shownSubs.length;
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
                      <span className="text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full">
                        {stage.name}
                      </span>
                    )}
                  </div>
                  {shownSubs.length > 0 && (
                    <div className="mb-2 space-y-0.5">
                      {shownSubs.map((s) => (
                        <div key={s.id} className="flex items-center gap-1.5 text-xs text-slate-400">
                          <div className="w-1 h-1 rounded-full bg-slate-600 shrink-0" />
                          <span className="truncate">{s.name}</span>
                          {s.plannedDate && <span className="shrink-0 text-slate-500">{s.plannedDate.slice(5)}</span>}
                        </div>
                      ))}
                      {moreCount > 0 && (
                        <div className="text-[11px] text-slate-500 pl-2.5">+{moreCount} 項</div>
                      )}
                    </div>
                  )}
                  {overdueCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-red-400 mb-1.5">
                      <AlertTriangle size={11} />
                      <span>{overdueCount} 個里程碑逾期</span>
                    </div>
                  )}
                  {nextDate && (
                    <div className="text-xs text-slate-400 pt-2 border-t border-slate-800">
                      ↗ 下一里程碑 <span className="text-slate-300">{nextDate}</span>
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
