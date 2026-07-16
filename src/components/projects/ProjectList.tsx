import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Program, Project } from '../../types';
import { computeProgressPercent, getCurrentStage, isGroupMilestone } from '../../services/milestoneUtils';
import { DEFAULT_PROJECT_ID } from '../../hooks/useProjects';

interface ProjectListProps {
  projects: Project[];
  programs: Program[];
  onOpen: (id: string) => void;
  onNewProject: () => void;
  onDelete: (id: string) => void;
}

const STATUS_COLOR: Record<string, string> = {
  進行中: 'text-primary-400 bg-primary-400/10',
  暫停: 'text-amber-400 bg-amber-400/10',
  取消: 'text-slate-500 bg-slate-500/10',
  已完成: 'text-emerald-400 bg-emerald-400/10'
};

// 欄位順序：小專案名稱/產品線/產品等級/備註/狀態/目前階段/進度%/刪除鈕
const DEFAULT_COL_WIDTHS = ['15%', '9%', '8%', '16%', '8%', '28%', '12%', '4%'];
const COL_WIDTHS_STORAGE_KEY = 'pe-pm:projectListColWidths';

function loadColWidths(): string[] {
  try {
    const saved = localStorage.getItem(COL_WIDTHS_STORAGE_KEY);
    if (saved) {
      const arr = JSON.parse(saved);
      if (Array.isArray(arr) && arr.length === DEFAULT_COL_WIDTHS.length && arr.every((w) => typeof w === 'string')) {
        return arr;
      }
    }
  } catch { /* 壞資料就用預設 */ }
  return DEFAULT_COL_WIDTHS;
}

function currentStageLabel(project: Project): string {
  const stage = getCurrentStage(project.milestones);
  if (!stage) return '—';
  if (isGroupMilestone(stage)) {
    const subNames = stage.subMilestones!.filter((s) => s.status !== '已完成').map((s) => s.name);
    return subNames.length > 0 ? `${stage.name}（${subNames.join('、')}）` : stage.name;
  }
  return stage.name;
}

interface ProjectTableProps {
  projects: Project[];
  colWidths: string[];
  onResizeCol: (index: number, px: number) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

function ProjectTable({ projects, colWidths, onResizeCol, onOpen, onDelete }: ProjectTableProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (confirmId === id) {
      onDelete(id);
      setConfirmId(null);
    } else {
      setConfirmId(id);
    }
  }

  function startResize(e: React.MouseEvent, index: number) {
    e.preventDefault();
    e.stopPropagation();
    const th = (e.currentTarget as HTMLElement).closest('th');
    if (!th) return;
    const startX = e.clientX;
    const startWidth = th.offsetWidth;
    function onMove(ev: MouseEvent) {
      onResizeCol(index, Math.max(60, startWidth + ev.clientX - startX));
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'col-resize';
  }

  const HEADERS: { label: string; align?: 'right' }[] = [
    { label: '小專案名稱' },
    { label: '產品線' },
    { label: '產品等級' },
    { label: '備註' },
    { label: '狀態' },
    { label: '目前階段' },
    { label: '進度%', align: 'right' },
  ];

  return (
    <table className="w-full text-sm table-fixed">
      <colgroup>
        {colWidths.map((w, i) => <col key={i} style={{ width: w }} />)}
      </colgroup>
      <thead className="bg-slate-900 text-slate-400 text-xs">
        <tr>
          {HEADERS.map((h, i) => (
            <th key={h.label} className={`relative px-4 py-2 ${h.align === 'right' ? 'text-right' : 'text-left'}`}>
              {h.label}
              {/* 拖拉把手：調整此欄寬度，同步套用到所有大專案的表格 */}
              <span
                onMouseDown={(e) => startResize(e, i)}
                className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary-500/50 select-none"
              />
            </th>
          ))}
          <th />
        </tr>
      </thead>
      <tbody>
        {projects.map((p) => {
          const pct = computeProgressPercent(p.milestones);
          const confirming = confirmId === p.id;
          return (
            <tr
              key={p.id}
              className="border-t border-slate-800 hover:bg-slate-900/60 cursor-pointer group"
              onClick={() => { if (!confirming) onOpen(p.id); }}
              onMouseLeave={() => { if (confirmId === p.id) setConfirmId(null); }}
            >
              <td className="px-4 py-3 font-medium break-words">{p.name}</td>
              <td className="px-4 py-3 text-slate-400 break-words">{p.productLine || '—'}</td>
              <td className="px-4 py-3 text-slate-400 break-words">{p.grade || '—'}</td>
              <td className="px-4 py-3 text-slate-400 break-words">{p.notes || '—'}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLOR[p.status]}`}>{p.status}</span>
              </td>
              <td className="px-4 py-3 text-slate-400 truncate" title={currentStageLabel(p)}>{currentStageLabel(p)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-xs text-slate-400 tabular-nums w-7 text-right">{pct}%</span>
                  <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden shrink-0">
                    <div className="h-full bg-primary-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </td>
              <td className="px-2 py-3 text-right">
                {confirming ? (
                  <button
                    onClick={(e) => handleDelete(e, p.id)}
                    className="text-xs text-red-400 hover:text-red-300 whitespace-nowrap px-1"
                  >
                    確認刪除?
                  </button>
                ) : (
                  <button
                    onClick={(e) => handleDelete(e, p.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function ProjectList({ projects, programs, onOpen, onNewProject, onDelete }: ProjectListProps) {
  // 虛擬的「日常行政/雜項」專案不是真的 NPI 專案，這頁不列出來（Task 建立時的專案選單才看得到）。
  const realProjects = projects.filter((p) => p.id !== DEFAULT_PROJECT_ID);
  const programIds = new Set(programs.map((p) => p.id));
  const grouped = programs
    .map((program) => ({ program, projects: realProjects.filter((p) => p.programId === program.id) }))
    .filter((g) => g.projects.length > 0);
  const ungrouped = realProjects.filter((p) => !p.programId || !programIds.has(p.programId));

  const [colWidths, setColWidths] = useState<string[]>(loadColWidths);
  const customized = colWidths.some((w, i) => w !== DEFAULT_COL_WIDTHS[i]);

  function resizeCol(index: number, px: number) {
    setColWidths((prev) => {
      const next = [...prev];
      next[index] = `${px}px`;
      try { localStorage.setItem(COL_WIDTHS_STORAGE_KEY, JSON.stringify(next)); } catch { /* 存不進去就只影響本次 */ }
      return next;
    });
  }

  function resetColWidths() {
    try { localStorage.removeItem(COL_WIDTHS_STORAGE_KEY); } catch { /* ignore */ }
    setColWidths(DEFAULT_COL_WIDTHS);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">專案</h1>
        <div className="flex items-center gap-3">
          {customized && (
            <button
              onClick={resetColWidths}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              重設欄寬
            </button>
          )}
          <button
            onClick={onNewProject}
            className="flex items-center gap-1 text-sm bg-primary-600 hover:bg-primary-500 rounded-lg px-3 py-1.5"
          >
            <Plus size={16} /> 新增專案
          </button>
        </div>
      </div>

      {realProjects.length === 0 && <p className="text-slate-500 text-sm">還沒有專案，點右上角新增一個吧。</p>}

      <div className="space-y-6">
        {grouped.map(({ program, projects: groupProjects }) => (
          <div key={program.id}>
            <h2 className="text-sm font-semibold text-slate-300 mb-2">
              {program.name}
              <span className="text-slate-500 font-normal ml-2">{groupProjects.length} 個小專案</span>
            </h2>
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <ProjectTable projects={groupProjects} colWidths={colWidths} onResizeCol={resizeCol} onOpen={onOpen} onDelete={onDelete} />
            </div>
          </div>
        ))}

        {ungrouped.length > 0 && (
          <div>
            {grouped.length > 0 && <h2 className="text-sm font-semibold text-slate-500 mb-2">未歸屬大專案</h2>}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <ProjectTable projects={ungrouped} colWidths={colWidths} onResizeCol={resizeCol} onOpen={onOpen} onDelete={onDelete} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
