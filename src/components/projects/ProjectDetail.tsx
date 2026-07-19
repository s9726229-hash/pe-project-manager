import { useState } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import type { Case, Note, Program, Project, ProjectDocument, Task, Template, TemplateCategory } from '../../types';
import ScheduleTab from './ScheduleTab';
import CaseList from '../cases/CaseList';
import CaseDetail from '../cases/CaseDetail';
import NewCaseModal from '../cases/NewCaseModal';
import NotesTab from '../notes/NotesTab';
import DocumentsTab from '../documents/DocumentsTab';
import ProjectTaskList from './ProjectTaskList';

interface ProjectDetailProps {
  project: Project;
  programs: Program[];
  onAddProgram: (name: string) => string;
  onBack: () => void;
  onDelete: (id: string) => void;
  onUpdateProject: (id: string, patch: Partial<Project>) => void;
  onUpdateMilestones: (projectId: string, milestones: Project['milestones']) => void;
  tasks: Task[];
  onChangeTask: (task: Task) => void;
  onPostponeTask: (id: string, newDate: string) => void;
  onAddSubTask: (parentId: string, title: string, dueDate?: string) => void;
  onDeleteTask: (id: string) => void;
  cases: Case[];
  templateCategories: TemplateCategory[];
  templates: Template[];
  onAddCase: (input: { projectId: string; name: string; openDate: string; partNumber?: string; notes?: string; template: Template }) => string;
  onUpdateCase: (id: string, patch: Partial<Case>) => void;
  onDeleteCase: (id: string) => void;
  notes: Note[];
  onSaveNote: (projectId: string, content: string) => void;
  documents: ProjectDocument[];
  onAddDocument: (input: { projectId: string; type: ProjectDocument['type']; title: string; date: string; content?: string }) => void;
  onUpdateDocument: (id: string, patch: Partial<ProjectDocument>) => void;
  onDeleteDocument: (id: string) => void;
}

type Tab = 'SCHEDULE' | 'TASKS' | 'NOTES' | 'CASES' | 'DOCS';

const TABS: { id: Tab; label: string }[] = [
  { id: 'SCHEDULE', label: '排程進度' },
  { id: 'TASKS', label: '任務' },
  { id: 'NOTES', label: '備忘事項' },
  { id: 'CASES', label: '問題/ECN案件' },
  { id: 'DOCS', label: '文件/會議記錄' }
];

const NEW_PROGRAM_VALUE = '__new__';

export default function ProjectDetail({
  project,
  programs,
  onAddProgram,
  onBack,
  onDelete,
  onUpdateProject,
  onUpdateMilestones,
  tasks,
  onChangeTask,
  onPostponeTask,
  onAddSubTask,
  onDeleteTask,
  cases,
  templateCategories,
  templates,
  onAddCase,
  onUpdateCase,
  onDeleteCase,
  notes,
  onSaveNote,
  documents,
  onAddDocument,
  onUpdateDocument,
  onDeleteDocument
}: ProjectDetailProps) {
  const [tab, setTab] = useState<Tab>('SCHEDULE');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [creatingProgram, setCreatingProgram] = useState(false);
  const [newProgramName, setNewProgramName] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [showNewCase, setShowNewCase] = useState(false);

  const projectCases = cases.filter((c) => c.projectId === project.id);
  const selectedCase = projectCases.find((c) => c.id === selectedCaseId) ?? null;
  const projectNote = notes.find((n) => n.projectId === project.id);
  const projectDocuments = documents.filter((d) => d.projectId === project.id);

  function field(patch: Partial<Project>) {
    onUpdateProject(project.id, patch);
  }

  function handleProgramChange(value: string) {
    if (value === NEW_PROGRAM_VALUE) {
      setCreatingProgram(true);
    } else {
      field({ programId: value || undefined });
    }
  }

  function handleConfirmNewProgram() {
    if (!newProgramName.trim()) return;
    const id = onAddProgram(newProgramName.trim());
    field({ programId: id });
    setCreatingProgram(false);
    setNewProgramName('');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200">
          <ArrowLeft size={16} /> 返回專案列表
        </button>
        {confirmDelete ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">確認刪除此專案？</span>
            <button onClick={() => onDelete(project.id)} className="text-red-400 hover:text-red-300">確認</button>
            <button onClick={() => setConfirmDelete(false)} className="text-slate-500 hover:text-slate-300">取消</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1 text-sm text-slate-600 hover:text-red-400 transition-colors">
            <Trash2 size={14} /> 刪除專案
          </button>
        )}
      </div>

      {/* Meta Block — 緊湊化 */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 mb-6 space-y-2">
        {/* 第一行：專案名稱 + 狀態 */}
        <div className="flex items-center justify-between gap-3">
          <input
            className="text-base font-semibold bg-transparent outline-none text-slate-100 flex-1 min-w-0 border-b border-transparent hover:border-slate-700 focus:border-primary-500 transition-colors pb-0.5"
            value={project.name}
            onChange={(e) => field({ name: e.target.value })}
            placeholder="專案名稱"
          />
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">{project.status}</span>
        </div>

        {/* 第二行：Metadata chips */}
        <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-slate-500">
          <span className="flex items-center gap-1">
            大專案
            <select
              className="bg-transparent text-slate-300 outline-none cursor-pointer hover:text-slate-100 transition-colors"
              value={project.programId ?? ''}
              onChange={(e) => handleProgramChange(e.target.value)}
            >
              <option value="">—</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
              <option value={NEW_PROGRAM_VALUE}>＋ 新增...</option>
            </select>
          </span>
          <span className="text-slate-700">·</span>
          <span className="flex items-center gap-1">
            產品線
            <input
              className="bg-transparent text-slate-300 outline-none w-24 border-b border-transparent hover:border-slate-700 focus:border-primary-500 transition-colors"
              value={project.productLine}
              onChange={(e) => field({ productLine: e.target.value })}
              placeholder="—"
            />
          </span>
          <span className="text-slate-700">·</span>
          <span className="flex items-center gap-1">
            等級
            <input
              className="bg-transparent text-slate-300 outline-none w-16 border-b border-transparent hover:border-slate-700 focus:border-primary-500 transition-colors"
              value={project.grade}
              onChange={(e) => field({ grade: e.target.value })}
              placeholder="—"
            />
          </span>
          <span className="text-slate-700">·</span>
          <span className="flex items-center gap-1">
            負責窗口
            <input
              className="bg-transparent text-slate-300 outline-none w-20 border-b border-transparent hover:border-slate-700 focus:border-primary-500 transition-colors"
              value={project.owner}
              onChange={(e) => field({ owner: e.target.value })}
              placeholder="—"
            />
          </span>
          <span className="text-slate-700">·</span>
          <span>啟動日 <span className="text-slate-400">{project.startDate}</span></span>
        </div>

        {creatingProgram && (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              className="bg-slate-800 rounded px-2 py-1 text-xs w-40"
              placeholder="新大專案名稱"
              value={newProgramName}
              onChange={(e) => setNewProgramName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirmNewProgram()}
            />
            <button onClick={handleConfirmNewProgram} className="text-xs text-primary-400 hover:text-primary-300 px-2">
              確定
            </button>
          </div>
        )}

        {/* 備註 */}
        <input
          className="w-full bg-transparent text-xs text-slate-400 outline-none placeholder-slate-600 border-t border-slate-800 pt-2"
          placeholder="備註..."
          value={project.notes}
          onChange={(e) => field({ notes: e.target.value })}
        />
      </div>

      <div className="flex items-center gap-1 border-b border-slate-800 mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm border-b-2 -mb-px ${
              tab === t.id ? 'border-primary-500 text-primary-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'SCHEDULE' && (
        <ScheduleTab
          milestones={project.milestones}
          projectStartDate={project.startDate}
          onChange={(milestones) => onUpdateMilestones(project.id, milestones)}
        />
      )}
      {tab === 'TASKS' && (
        <ProjectTaskList
          projectId={project.id}
          tasks={tasks}
          onChange={onChangeTask}
          onPostpone={onPostponeTask}
          onAddSubTask={onAddSubTask}
          onDelete={onDeleteTask}
        />
      )}
      {tab === 'NOTES' && <NotesTab note={projectNote} onSave={(content) => onSaveNote(project.id, content)} />}

      {tab === 'CASES' &&
        (selectedCase ? (
          <CaseDetail caseItem={selectedCase} onBack={() => setSelectedCaseId(null)} onUpdate={onUpdateCase} onDelete={onDeleteCase} />
        ) : (
          <>
            <CaseList cases={projectCases} onOpen={setSelectedCaseId} onNewCase={() => setShowNewCase(true)} />
            {showNewCase && (
              <NewCaseModal
                categories={templateCategories}
                templates={templates}
                onCancel={() => setShowNewCase(false)}
                onCreate={(input) => {
                  const id = onAddCase({ ...input, projectId: project.id });
                  setShowNewCase(false);
                  setSelectedCaseId(id);
                }}
              />
            )}
          </>
        ))}

      {tab === 'DOCS' && (
        <DocumentsTab
          documents={projectDocuments}
          onAdd={(input) => onAddDocument({ ...input, projectId: project.id })}
          onUpdate={onUpdateDocument}
          onDelete={onDeleteDocument}
        />
      )}
    </div>
  );
}
