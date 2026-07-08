import { Plus } from 'lucide-react';
import type { Program, Project } from '../../types';
import { computeProgressPercent, getCurrentStage, isGroupMilestone } from '../../services/milestoneUtils';

interface ProjectListProps {
  projects: Project[];
  programs: Program[];
  onOpen: (id: string) => void;
  onNewProject: () => void;
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

function ProjectTable({ projects, onOpen }: { projects: Project[]; onOpen: (id: string) => void }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-900 text-slate-400 text-xs">
        <tr>
          <th className="text-left px-4 py-2">專案代號/名稱</th>
          <th className="text-left px-4 py-2">產品線</th>
          <th className="text-left px-4 py-2">狀態</th>
          <th className="text-left px-4 py-2">目前階段</th>
          <th className="text-left px-4 py-2">進度%</th>
        </tr>
      </thead>
      <tbody>
        {projects.map((p) => (
          <tr key={p.id} className="border-t border-slate-800 hover:bg-slate-900/60 cursor-pointer" onClick={() => onOpen(p.id)}>
            <td className="px-4 py-3">
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-slate-500">{p.code}</div>
            </td>
            <td className="px-4 py-3 text-slate-400">{p.productLine || '—'}</td>
            <td className="px-4 py-3">
              <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLOR[p.status]}`}>{p.status}</span>
            </td>
            <td className="px-4 py-3 text-slate-400">{currentStageLabel(p)}</td>
            <td className="px-4 py-3 text-slate-400">{computeProgressPercent(p.milestones)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ProjectList({ projects, programs, onOpen, onNewProject }: ProjectListProps) {
  const programIds = new Set(programs.map((p) => p.id));
  const grouped = programs
    .map((program) => ({ program, projects: projects.filter((p) => p.programId === program.id) }))
    .filter((g) => g.projects.length > 0);
  const ungrouped = projects.filter((p) => !p.programId || !programIds.has(p.programId));

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

      {projects.length === 0 && <p className="text-slate-500 text-sm">還沒有專案，點右上角新增一個吧。</p>}

      <div className="space-y-6">
        {grouped.map(({ program, projects: groupProjects }) => (
          <div key={program.id}>
            <h2 className="text-sm font-semibold text-slate-300 mb-2">
              {program.code} － {program.name}
              <span className="text-slate-500 font-normal ml-2">{groupProjects.length} 個小專案</span>
            </h2>
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <ProjectTable projects={groupProjects} onOpen={onOpen} />
            </div>
          </div>
        ))}

        {ungrouped.length > 0 && (
          <div>
            {grouped.length > 0 && <h2 className="text-sm font-semibold text-slate-500 mb-2">未歸屬大專案</h2>}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <ProjectTable projects={ungrouped} onOpen={onOpen} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
