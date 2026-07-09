import { useState } from 'react';
import { Flame, Plus, Trash2 } from 'lucide-react';
import type { Project, Task } from '../../types';
import { getEffectiveDueDate, getEffectiveStatus, isParentTask, isTaskUrgent } from '../../services/taskUtils';

interface TaskRowProps {
  task: Task;
  project?: Project;
  showProjectTag: boolean;
  onChange: (task: Task) => void;
  onPostpone: (id: string, newDate: string) => void;
  onAddSubTask: (parentId: string, title: string) => void;
  onDelete: (id: string) => void;
  depth?: number;
}

const STATUS_COLOR: Record<string, string> = {
  待辦: 'text-slate-400',
  進行中: 'text-amber-400',
  已完成: 'text-emerald-400'
};

export default function TaskRow({ task, project, showProjectTag, onChange, onPostpone, onAddSubTask, onDelete, depth = 0 }: TaskRowProps) {
  const [addingSub, setAddingSub] = useState(false);
  const [newSubTitle, setNewSubTitle] = useState('');

  const isParent = isParentTask(task);
  const effectiveStatus = getEffectiveStatus(task);
  const effectiveDueDate = getEffectiveDueDate(task);
  const urgent = isTaskUrgent(task);
  const done = effectiveStatus === '已完成';

  function updateField(patch: Partial<Task>) {
    onChange({ ...task, ...patch });
  }

  function submitSubTask() {
    if (!newSubTitle.trim()) return;
    onAddSubTask(task.id, newSubTitle.trim());
    setNewSubTitle('');
    setAddingSub(false);
  }

  return (
    <div className={depth > 0 ? 'ml-6' : ''}>
      <div className={`flex items-center gap-2 flex-wrap py-2 px-3 rounded-lg ${depth === 0 ? 'bg-slate-900/60 border border-slate-800' : ''}`}>
        {!isParent ? (
          <select
            className={`bg-slate-800 rounded px-2 py-1 text-xs shrink-0 ${STATUS_COLOR[task.status ?? '待辦']}`}
            value={task.status ?? '待辦'}
            onChange={(e) => updateField({ status: e.target.value as Task['status'] })}
          >
            <option value="待辦">待辦</option>
            <option value="進行中">進行中</option>
            <option value="已完成">已完成</option>
          </select>
        ) : (
          <span className={`text-xs px-2 py-1 rounded bg-slate-800 shrink-0 ${STATUS_COLOR[effectiveStatus ?? '待辦']}`}>
            {effectiveStatus}
          </span>
        )}

        {urgent && (
          <span title="急件" className="shrink-0">
            <Flame size={14} className="text-red-400" />
          </span>
        )}

        <input
          className={`flex-1 min-w-[8rem] bg-transparent outline-none ${done ? 'line-through text-slate-500' : ''}`}
          value={task.title}
          onChange={(e) => updateField({ title: e.target.value })}
        />

        {showProjectTag && project && (
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">{project.name}</span>
        )}

        {!isParent && (
          <>
            <input
              type="date"
              className="bg-slate-800 rounded px-2 py-1 text-xs shrink-0"
              value={task.dueDate ?? ''}
              onChange={(e) => onPostpone(task.id, e.target.value)}
            />
            <button
              onClick={() => updateField({ urgent: !task.urgent })}
              className={`text-xs px-2 py-1 rounded shrink-0 ${urgent ? 'bg-red-400/10 text-red-400' : 'bg-slate-800 text-slate-500'}`}
              title="切換急件"
            >
              急件
            </button>
          </>
        )}
        {isParent && effectiveDueDate && <span className="text-xs text-slate-500 shrink-0">{effectiveDueDate}</span>}

        {depth === 0 && (
          <button
            onClick={() => setAddingSub((v) => !v)}
            className="text-slate-500 hover:text-primary-400 p-1 shrink-0"
            title="新增子任務"
          >
            <Plus size={14} />
          </button>
        )}
        <button onClick={() => onDelete(task.id)} className="text-slate-500 hover:text-red-400 p-1 shrink-0" title="刪除">
          <Trash2 size={14} />
        </button>
      </div>

      {addingSub && (
        <div className="flex items-center gap-2 mt-1 ml-6">
          <input
            autoFocus
            className="bg-slate-800 rounded px-2 py-1 text-sm flex-1"
            placeholder="子任務名稱"
            value={newSubTitle}
            onChange={(e) => setNewSubTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitSubTask()}
          />
          <button onClick={submitSubTask} className="text-sm text-primary-400 hover:text-primary-300 px-2">
            新增
          </button>
        </div>
      )}

      {isParent && (
        <div className="mt-1 space-y-1">
          {task.subTasks!.map((sub) => (
            <TaskRow
              key={sub.id}
              task={sub}
              project={project}
              showProjectTag={false}
              depth={depth + 1}
              onPostpone={onPostpone}
              onAddSubTask={onAddSubTask}
              onDelete={onDelete}
              onChange={(updated) => {
                const subTasks = task.subTasks!.map((s) => (s.id === updated.id ? updated : s));
                onChange({ ...task, subTasks });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
