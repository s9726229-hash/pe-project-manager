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

function currentStageLabel(project: Project): string {
  const stage = getCurrentStage(project.milestones);
  if (!stage) return '—';
  if (isGroupMilestone(stage)) {
    const subNames = stage.subMilestones!.filter((s) => s.status !== '已完成').map((s) => s.name);
    return subNames.length > 0 ? `${stage.name}（${subNames.join('、')}）` : stage.name;
  }
  return stage.name;
}

function ProjectTable({ projects, onOpen, onDelete }: { projects: Project[]; onOpen: (id: string) => void; onDelete: (id: string) => void }) {
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

  return (
    <table className="w-full text-sm table-fixed">
      <colgroup>
        <col style={{ width: '15%' }} />
        <col style={{ width: '10%' }} />
        <col style={{ width: '10%' }} />
        <col style={{ width: '9%' }} />
        <col style={{ width: '40%' }} />
        <col style={{ width: '12%' }} />
        <col style={{ width: '4%' }} />
      </colgroup>
      <thead className="bg-slate-900 text-slate-400 text-xs">
        <tr>
          <th className="text-left px-4 py-2">小專案名稱</th>
          <th className="text-left px-4 py-2">產品線</th>
          <th className="text-left px-4 py-2">產品等級</th>
          <th className="text-left px-4 py-2">狀態</th>
          <th className="text-left px-4 py-2">目前階段</th>
          <th className="text-right px-4 py-2">進度%</th>
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
              <td className="px-4 py-3 font-medium truncate">{p.name}</td>
              <td className="px-4 py-3 text-slate-400 truncate">{p.productLine || '—'}</td>
              <td className="px-4 py-3 text-slate-400 truncate">{p.grade || '—'}</td>
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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">專案</h1>
        <button
          onClick={onNewProject}
          className="flex items-center gap-1 text-sm bg-primary-600 hover:bg-primary-500 rounded-lg px-3 py-1.5"
        >
          <Plus size={16} /> 新增專案
        </button>
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
              <ProjectTable projects={groupProjects} onOpen={onOpen} onDelete={onDelete} />
            </div>
          </div>
        ))}

        {ungrouped.length > 0 && (
          <div>
            {grouped.length > 0 && <h2 className="text-sm font-semibold text-slate-500 mb-2">未歸屬大專案</h2>}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <ProjectTable projects={ungrouped} onOpen={onOpen} onDelete={onDelete} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
