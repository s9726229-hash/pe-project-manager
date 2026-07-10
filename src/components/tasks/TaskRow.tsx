import { useState } from 'react';
import { Flame, Plus, Trash2 } from 'lucide-react';
import type { Task } from '../../types';
import { getEffectiveDueDate, getEffectiveStatus, isParentTask, isTaskUrgent } from '../../services/taskUtils';

interface TaskRowProps {
  task: Task;
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

export default function TaskRow({ task, onChange, onPostpone, onAddSubTask, onDelete, depth = 0 }: TaskRowProps) {
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
      <div className={`flex items-center gap-2 py-2 px-3 rounded-lg ${depth === 0 ? 'bg-slate-900/60 border border-slate-800' : ''}`}>
        {/* 狀態：葉節點可選，父項目顯示推算出來的唯讀徽章，寬度一致才會對齊 */}
        <div className="w-20 shrink-0">
          {!isParent ? (
            <select
              className={`w-full bg-slate-800 rounded px-2 py-1 text-xs ${STATUS_COLOR[task.status ?? '待辦']}`}
              value={task.status ?? '待辦'}
              onChange={(e) => updateField({ status: e.target.value as Task['status'] })}
            >
              <option value="待辦">待辦</option>
              <option value="進行中">進行中</option>
              <option value="已完成">已完成</option>
            </select>
          ) : (
            <span className={`block text-center text-xs px-2 py-1 rounded bg-slate-800 ${STATUS_COLOR[effectiveStatus ?? '待辦']}`}>
              {effectiveStatus}
            </span>
          )}
        </div>

        <div className="w-4 shrink-0 flex justify-center">
          {urgent && <Flame size={14} className="text-red-400" />}
        </div>

        <input
          className={`flex-1 min-w-[6rem] bg-transparent outline-none ${done ? 'line-through text-slate-500' : ''}`}
          value={task.title}
          onChange={(e) => updateField({ title: e.target.value })}
        />

        <div className="w-32 shrink-0">
          {!isParent ? (
            <input
              type="date"
              className="w-full bg-slate-800 rounded px-2 py-1 text-xs"
              value={task.dueDate ?? ''}
              onChange={(e) => onPostpone(task.id, e.target.value)}
            />
          ) : (
            <span className="block text-xs text-slate-500 px-2 py-1">{effectiveDueDate ?? '—'}</span>
          )}
        </div>

        <div className="w-14 shrink-0">
          {!isParent && (
            <button
              onClick={() => updateField({ urgent: !task.urgent })}
              className={`w-full text-xs px-2 py-1 rounded ${urgent ? 'bg-red-400/10 text-red-400' : 'bg-slate-800 text-slate-500'}`}
            >
              急件
            </button>
          )}
        </div>

        <div className="w-8 shrink-0 flex justify-center">
          {depth === 0 && (
            <button onClick={() => setAddingSub((v) => !v)} className="text-slate-500 hover:text-primary-400 p-1" title="新增子任務">
              <Plus size={14} />
            </button>
          )}
        </div>
        <div className="w-8 shrink-0 flex justify-center">
          <button onClick={() => onDelete(task.id)} className="text-slate-500 hover:text-red-400 p-1" title="刪除">
            <Trash2 size={14} />
          </button>
        </div>
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
