import { useState } from 'react';
import type { Milestone } from '../../types';
import { rescheduleAfterEndDateEdit } from '../../services/scheduling';
import MilestoneRow from './MilestoneRow';
import GanttView from './GanttView';

interface ScheduleTabProps {
  milestones: Milestone[];
  projectStartDate: string;
  onChange: (milestones: Milestone[]) => void;
}

export default function ScheduleTab({ milestones, projectStartDate, onChange }: ScheduleTabProps) {
  const [mode, setMode] = useState<'table' | 'gantt'>('table');

  function updateMilestone(updated: Milestone) {
    onChange(milestones.map((m) => (m.id === updated.id ? updated : m)));
  }

  // 改結束時間：反推工期，從專案啟動日整條重新排程，後面所有項目跟著順延/提前。
  function handleEndDateChange(leafId: string, newValue: string) {
    onChange(rescheduleAfterEndDateEdit(milestones, leafId, newValue, projectStartDate));
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setMode('table')}
          className={`text-xs px-3 py-1.5 rounded-lg border ${mode === 'table' ? 'border-primary-500 text-primary-400' : 'border-slate-700 text-slate-400'}`}
        >
          表格
        </button>
        <button
          onClick={() => setMode('gantt')}
          className={`text-xs px-3 py-1.5 rounded-lg border ${mode === 'gantt' ? 'border-primary-500 text-primary-400' : 'border-slate-700 text-slate-400'}`}
        >
          甘特圖
        </button>
      </div>

      {mode === 'table' && (
        <div className="space-y-2">
          {milestones.map((m) => (
            <MilestoneRow key={m.id} milestone={m} onChange={updateMilestone} onEndDateChange={handleEndDateChange} />
          ))}
        </div>
      )}

      {mode === 'gantt' && <GanttView milestones={milestones} />}
    </div>
  );
}
