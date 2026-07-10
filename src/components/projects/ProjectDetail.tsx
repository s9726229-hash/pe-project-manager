import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { Case, Note, Program, Project, ProjectDocument, Template, TemplateCategory } from '../../types';
import ScheduleTab from './ScheduleTab';
import CaseList from '../cases/CaseList';
import CaseDetail from '../cases/CaseDetail';
import NewCaseModal from '../cases/NewCaseModal';
import NotesTab from '../notes/NotesTab';
import DocumentsTab from '../documents/DocumentsTab';

interface ProjectDetailProps {
  project: Project;
  programs: Program[];
  onAddProgram: (name: string) => string;
  onBack: () => void;
  onUpdateProject: (id: string, patch: Partial<Project>) => void;
  onUpdateMilestones: (projectId: string, milestones: Project['milestones']) => void;
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

type Tab = 'SCHEDULE' | 'NOTES' | 'CASES' | 'DOCS';

const TABS: { id: Tab; label: string }[] = [
  { id: 'SCHEDULE', label: '排程進度' },
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
  onUpdateProject,
  onUpdateMilestones,
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
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 mb-4">
        <ArrowLeft size={16} /> 返回專案列表
      </button>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 mb-6 space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 flex-1">
            <label className="text-xs text-slate-400 space-y-1 block">
              大專案
              <select
                className="w-full bg-slate-800 rounded px-2 py-1.5 text-sm"
                value={project.programId ?? ''}
                onChange={(e) => handleProgramChange(e.target.value)}
              >
                <option value="">不掛</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
                <option value={NEW_PROGRAM_VALUE}>＋ 新增...</option>
              </select>
            </label>
            <label className="text-xs text-slate-400 space-y-1 block">
              小專案
              <input
                className="w-full bg-slate-800 rounded px-2 py-1.5 text-sm font-semibold text-slate-100"
                value={project.name}
                onChange={(e) => field({ name: e.target.value })}
              />
            </label>
            <label className="text-xs text-slate-400 space-y-1 block">
              產品線
              <input
                className="w-full bg-slate-800 rounded px-2 py-1.5 text-sm"
                value={project.productLine}
                onChange={(e) => field({ productLine: e.target.value })}
              />
            </label>
            <label className="text-xs text-slate-400 space-y-1 block">
              產品等級
              <input
                className="w-full bg-slate-800 rounded px-2 py-1.5 text-sm"
                value={project.grade}
                onChange={(e) => field({ grade: e.target.value })}
              />
            </label>
            <label className="text-xs text-slate-400 space-y-1 block">
              負責窗口
              <input
                className="w-full bg-slate-800 rounded px-2 py-1.5 text-sm"
                value={project.owner}
                onChange={(e) => field({ owner: e.target.value })}
              />
            </label>
            <label className="text-xs text-slate-400 space-y-1 block">
              啟動日
              <div className="w-full bg-slate-800/50 rounded px-2 py-1.5 text-sm text-slate-400">{project.startDate}</div>
            </label>
          </div>
          <span className="text-xs px-2 py-1.5 rounded bg-slate-800 text-slate-400 shrink-0">{project.status}</span>
        </div>

        {creatingProgram && (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              className="bg-slate-800 rounded px-2 py-1.5 text-sm w-48"
              placeholder="新大專案名稱"
              value={newProgramName}
              onChange={(e) => setNewProgramName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirmNewProgram()}
            />
            <button onClick={handleConfirmNewProgram} className="text-sm text-primary-400 hover:text-primary-300 px-2">
              確定
            </button>
          </div>
        )}

        <label className="text-xs text-slate-400 space-y-1 block">
          備註
          <input
            className="w-full bg-slate-800 rounded px-2 py-1.5 text-sm"
            value={project.notes}
            onChange={(e) => field({ notes: e.target.value })}
          />
        </label>
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
