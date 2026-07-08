import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { Project } from '../../types';
import ScheduleTab from './ScheduleTab';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  onUpdateMilestones: (projectId: string, milestones: Project['milestones']) => void;
}

type Tab = 'SCHEDULE' | 'NOTES' | 'CASES' | 'DOCS';

const TABS: { id: Tab; label: string }[] = [
  { id: 'SCHEDULE', label: '排程進度' },
  { id: 'NOTES', label: '備忘事項' },
  { id: 'CASES', label: '問題/ECN案件' },
  { id: 'DOCS', label: '文件/會議記錄' }
];

export default function ProjectDetail({ project, onBack, onUpdateMilestones }: ProjectDetailProps) {
  const [tab, setTab] = useState<Tab>('SCHEDULE');

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 mb-4">
        <ArrowLeft size={16} /> 返回專案列表
      </button>

      <h1 className="text-2xl font-semibold mb-1">{project.name}</h1>
      <p className="text-sm text-slate-500 mb-6">
        {project.productLine || '—'}
        {project.grade ? ` ・ ${project.grade}` : ''} ・ 啟動日 {project.startDate} ・ 負責人 {project.owner || '—'} ・ {project.status}
        {project.notes ? ` ・ ${project.notes}` : ''}
      </p>

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
        <ScheduleTab milestones={project.milestones} onChange={(milestones) => onUpdateMilestones(project.id, milestones)} />
      )}
      {tab === 'NOTES' && <p className="text-slate-500 text-sm">備忘事項功能將在階段 5 實作。</p>}
      {tab === 'CASES' && <p className="text-slate-500 text-sm">問題/ECN 案件功能將在階段 4 實作。</p>}
      {tab === 'DOCS' && <p className="text-slate-500 text-sm">文件/會議記錄功能將在階段 5 實作。</p>}
    </div>
  );
}
