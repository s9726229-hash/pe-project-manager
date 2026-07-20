import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Program, Project } from '../../types';
import { computeProgressPercent, flattenLeaves, getCurrentStage, isGroupMilestone, isMilestoneDone } from '../../services/milestoneUtils';
import { DEFAULT_PROJECT_ID } from '../../hooks/useProjects';

interface ProjectListProps {
  projects: Project[];
  programs: Program[];
  onOpen: (id: string) => void;
  onNewProject: () => void;
  onDelete: (id: string) => void;
}

const DEFAULT_COL_WIDTHS = ['22%', '12%', '7%', '15%', '8%', '20%', '12%', '4%'];
const COL_WIDTHS_STORAGE_KEY = 'pe-pm:projectListColWidths:v2';
const STATUS_COLOR: Record<string, string> = {
  '進行中': 'text-primary-400 bg-primary-400/10',
  '暫停': 'text-amber-400 bg-amber-400/10',
  '取消': 'text-slate-500 bg-slate-500/10',
  '已完成': 'text-emerald-400 bg-emerald-400/10',
};

function loadColWidths(): string[] {
  try {
    const saved = localStorage.getItem(COL_WIDTHS_STORAGE_KEY);
    if (saved) {
      const widths = JSON.parse(saved);
      if (Array.isArray(widths) && widths.length === DEFAULT_COL_WIDTHS.length && widths.every((width) => typeof width === 'string')) return widths;
    }
  } catch { /* local storage is optional */ }
  return DEFAULT_COL_WIDTHS;
}

function currentStageInfo(project: Project): { stage: string; next?: string } {
  const stage = getCurrentStage(project.milestones);
  if (!stage) return { stage: '—' };
  if (!isGroupMilestone(stage)) return { stage: stage.name };
  const next = flattenLeaves(stage.subMilestones!).find((milestone) => !isMilestoneDone(milestone));
  return { stage: stage.name, next: next?.name };
}

function getGroupSummary(projects: Project[]) {
  const progress = Math.round(projects.reduce((total, project) => total + computeProgressPercent(project.milestones), 0) / projects.length);
  const atRisk = projects.filter((project) => computeProgressPercent(project.milestones) < 100).length;
  return { progress, atRisk };
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
  const headers = ['小專案名稱', '產品線', '產品等級', '備註', '狀態', '目前階段', '進度%'];

  function handleDelete(event: React.MouseEvent, id: string) {
    event.stopPropagation();
    if (confirmId === id) {
      onDelete(id);
      setConfirmId(null);
    } else {
      setConfirmId(id);
    }
  }

  function startResize(event: React.MouseEvent, index: number) {
    event.preventDefault();
    event.stopPropagation();
    const header = (event.currentTarget as HTMLElement).closest('th');
    if (!header) return;
    const startX = event.clientX;
    const startWidth = header.offsetWidth;
    function onMove(moveEvent: MouseEvent) {
      onResizeCol(index, Math.max(60, startWidth + moveEvent.clientX - startX));
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

  return (
    <table className="w-full text-sm table-fixed">
      <colgroup>{colWidths.map((width, index) => <col key={index} style={{ width }} />)}</colgroup>
      <thead className="bg-slate-900 text-slate-400 text-xs">
        <tr>
          {headers.map((header, index) => (
            <th key={header} className={`relative px-4 py-2 ${index === 6 ? 'text-right' : 'text-left'}`}>
              {header}
              <span onMouseDown={(event) => startResize(event, index)} className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary-500/50 select-none" />
            </th>
          ))}
          <th />
        </tr>
      </thead>
      <tbody>
        {projects.map((project) => {
          const progress = computeProgressPercent(project.milestones);
          const stage = currentStageInfo(project);
          const confirming = confirmId === project.id;
          return (
            <tr key={project.id} className="border-t border-slate-800 hover:bg-slate-900/60 cursor-pointer group" onClick={() => { if (!confirming) onOpen(project.id); }} onMouseLeave={() => { if (confirmId === project.id) setConfirmId(null); }}>
              <td className="px-4 py-3 font-medium break-words">{project.name}</td>
              <td className="px-4 py-3 text-slate-400 whitespace-normal break-words">{project.productLine || '—'}</td>
              <td className="px-4 py-3 text-slate-400 break-words">{project.grade || '—'}</td>
              <td className="px-4 py-3 text-slate-400 break-words">{project.notes || '—'}</td>
              <td className="px-4 py-3 whitespace-nowrap"><span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLOR[project.status] ?? 'text-slate-300 bg-slate-500/10'}`}>{project.status}</span></td>
              <td className="px-4 py-3 text-slate-400" title={stage.next ? `${stage.stage} — ${stage.next}` : stage.stage}>
                <div className="leading-5 break-words">{stage.stage}</div>
                {stage.next && <div className="text-xs text-slate-500 leading-4 break-words">Next: {stage.next}</div>}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                  <span className="text-xs text-slate-400 tabular-nums w-8 text-right">{progress}%</span>
                  <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden shrink-0"><div className="h-full bg-primary-500 rounded-full" style={{ width: `${progress}%` }} /></div>
                </div>
              </td>
              <td className="px-2 py-3 text-right">
                <button onClick={(event) => handleDelete(event, project.id)} className={confirming ? 'text-xs text-red-400 hover:text-red-300 whitespace-nowrap px-1' : 'opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-opacity'} aria-label={confirming ? `Confirm delete ${project.name}` : `Delete ${project.name}`}>
                  {confirming ? '確認刪除' : <Trash2 size={14} />}
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function ProjectList({ projects, programs, onOpen, onNewProject, onDelete }: ProjectListProps) {
  const realProjects = projects.filter((project) => project.id !== DEFAULT_PROJECT_ID);
  const programIds = new Set(programs.map((program) => program.id));
  const grouped = programs.map((program) => ({ program, projects: realProjects.filter((project) => project.programId === program.id) })).filter((group) => group.projects.length > 0);
  const ungrouped = realProjects.filter((project) => !project.programId || !programIds.has(project.programId));
  const [colWidths, setColWidths] = useState<string[]>(loadColWidths);
  const [collapsedProgramIds, setCollapsedProgramIds] = useState<Set<string>>(() => new Set());
  const customized = colWidths.some((width, index) => width !== DEFAULT_COL_WIDTHS[index]);

  function resizeCol(index: number, px: number) {
    setColWidths((previous) => {
      const next = [...previous];
      next[index] = `${px}px`;
      try { localStorage.setItem(COL_WIDTHS_STORAGE_KEY, JSON.stringify(next)); } catch { /* local storage is optional */ }
      return next;
    });
  }

  function toggleProgram(id: string) {
    setCollapsedProgramIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">專案</h1>
        <div className="flex items-center gap-3">
          {customized && <button onClick={() => { try { localStorage.removeItem(COL_WIDTHS_STORAGE_KEY); } catch { /* ignore */ } setColWidths(DEFAULT_COL_WIDTHS); }} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">重設欄寬</button>}
          <button onClick={onNewProject} className="flex items-center gap-1 text-sm bg-primary-600 hover:bg-primary-500 rounded-lg px-3 py-1.5"><Plus size={16} /> 新增專案</button>
        </div>
      </div>
      {realProjects.length === 0 && <p className="text-slate-500 text-sm">尚無專案，請新增專案。</p>}
      <div className="space-y-6">
        {grouped.map(({ program, projects: groupProjects }) => {
          const collapsed = collapsedProgramIds.has(program.id);
          const summary = getGroupSummary(groupProjects);
          const contentId = `program-${program.id}`;
          const summaryLabel = `${program.name} 群組，${groupProjects.length} 個小專案，進度 ${summary.progress}%，${summary.atRisk} 個風險中`;
          return (
            <section key={program.id} className="border border-slate-800 rounded-xl overflow-hidden">
              <button type="button" aria-expanded={!collapsed} aria-controls={contentId} aria-label={summaryLabel} onClick={() => toggleProgram(program.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left bg-slate-900/60 hover:bg-slate-900 transition-colors">
                {collapsed ? <ChevronRight size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
                <span className="font-semibold text-slate-200">{program.name}</span>
                <span className="text-xs text-slate-500">{groupProjects.length} 個小專案</span>
                <span className="ml-auto text-xs text-slate-400 tabular-nums">{summary.progress}%</span>
                <span className={`text-xs ${summary.atRisk > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{summary.atRisk} 個風險中</span>
              </button>
              {!collapsed && <div id={contentId}><ProjectTable projects={groupProjects} colWidths={colWidths} onResizeCol={resizeCol} onOpen={onOpen} onDelete={onDelete} /></div>}
            </section>
          );
        })}
        {ungrouped.length > 0 && (
          <div>
            {grouped.length > 0 && <h2 className="text-sm font-semibold text-slate-500 mb-2">未歸屬大專案</h2>}
            <div className="border border-slate-800 rounded-xl overflow-hidden"><ProjectTable projects={ungrouped} colWidths={colWidths} onResizeCol={resizeCol} onOpen={onOpen} onDelete={onDelete} /></div>
          </div>
        )}
      </div>
    </div>
  );
}
