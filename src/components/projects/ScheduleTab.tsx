import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Milestone } from '../../types';
import {
  makeNewGroupMilestone,
  makeNewLeafMilestone,
  rescheduleAfterEndDateEdit,
  rescheduleFromStart
} from '../../services/scheduling';
import { addSubMilestone, findMilestoneById, nextGroupOrder, removeMilestoneById } from '../../services/milestoneUtils';
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

  function handleAddSubItem(parentId: string) {
    const parent = findMilestoneById(milestones, parentId);
    const order = nextGroupOrder(parent?.subMilestones ?? []);
    const updated = addSubMilestone(milestones, parentId, makeNewLeafMilestone('新子項目', order));
    onChange(rescheduleFromStart(updated, projectStartDate));
  }

  function handleDelete(id: string) {
    onChange(rescheduleFromStart(removeMilestoneById(milestones, id), projectStartDate));
  }

  function handleAddTopLevelLeaf() {
    const updated = [...milestones, makeNewLeafMilestone('新項目', nextGroupOrder(milestones))];
    onChange(rescheduleFromStart(updated, projectStartDate));
  }

  function handleAddTopLevelGroup() {
    const updated = [...milestones, makeNewGroupMilestone('新群組', nextGroupOrder(milestones))];
    onChange(rescheduleFromStart(updated, projectStartDate));
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
        <div>
          <div className="space-y-2 mb-3">
            {milestones.map((m) => (
              <MilestoneRow
                key={m.id}
                milestone={m}
                onChange={updateMilestone}
                onEndDateChange={handleEndDateChange}
                onAddSubItem={handleAddSubItem}
                onDelete={handleDelete}
              />
            ))}
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleAddTopLevelLeaf} className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
              <Plus size={14} /> 新增項目
            </button>
            <button onClick={handleAddTopLevelGroup} className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
              <Plus size={14} /> 新增群組
            </button>
          </div>
        </div>
      )}

      {mode === 'gantt' && <GanttView milestones={milestones} />}
    </div>
  );
}
