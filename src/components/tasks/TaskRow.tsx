import { useState } from 'react';
import { ChevronDown, ChevronRight, Flame, MessageSquare, Plus, Trash2 } from 'lucide-react';
import type { Task } from '../../types';
import { getEffectiveDueDate, getEffectiveStatus, isParentTask, isTaskUrgent } from '../../services/taskUtils';

interface TaskRowProps {
  task: Task;
  onChange: (task: Task) => void;
  onPostpone: (id: string, newDate: string) => void;
  onAddSubTask: (parentId: string, title: string, dueDate?: string) => void;
  onDelete: (id: string) => void;
  depth?: number;
}

const STATUS_COLOR: Record<string, string> = {
  待辦: 'text-slate-400 bg-slate-800 border-slate-700',
  進行中: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  已完成: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
};

export default function TaskRow({ task, onChange, onPostpone, onAddSubTask, onDelete, depth = 0 }: TaskRowProps) {
  const [addingSub, setAddingSub] = useState(false);
  const [newSubTitle, setNewSubTitle] = useState('');
  const [newSubDate, setNewSubDate] = useState('');
  const [notesOpen, setNotesOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const isParent = isParentTask(task);
  const effectiveStatus = getEffectiveStatus(task);
  const effectiveDueDate = getEffectiveDueDate(task);
  const urgent = isTaskUrgent(task);
  const done = effectiveStatus === '已完成';

  function updateField(patch: Partial<Task>) { onChange({ ...task, ...patch }); }

  function submitSubTask() {
    if (!newSubTitle.trim()) return;
    onAddSubTask(task.id, newSubTitle.trim(), newSubDate || undefined);
    setNewSubTitle('');
    setNewSubDate('');
    setAddingSub(false);
  }

  // ── Parent task: container style ──
  if (isParent && depth === 0) {
    return (
      <div className="rounded-lg overflow-hidden border border-slate-700/60">
        {/* Header */}
        <div
          className="flex items-center gap-2 px-3 py-2.5 bg-slate-800 group/hdr cursor-pointer select-none"
          onClick={() => setCollapsed((v) => !v)}
        >
          <button className="text-slate-400 hover:text-slate-200 shrink-0"
            onClick={(e) => { e.stopPropagation(); setCollapsed((v) => !v); }}>
            {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </button>
          {urgent && <Flame size={14} className="text-red-400 shrink-0" />}
          <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 font-medium ${STATUS_COLOR[effectiveStatus ?? '待辦']}`}>
            {effectiveStatus ?? '待辦'}
          </span>
          <input
            className={`flex-1 min-w-0 font-semibold bg-transparent outline-none text-slate-100 text-sm cursor-text ${done ? 'line-through text-slate-500' : ''}`}
            value={task.title}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => updateField({ title: e.target.value })}
          />
          <div className="flex items-center gap-2 shrink-0 text-xs text-slate-500"
            onClick={(e) => e.stopPropagation()}>
            <span>{effectiveDueDate ?? '—'}</span>
            <button onClick={() => setNotesOpen((v) => !v)}
              className={`p-1 ${notesOpen || task.notes ? 'text-primary-400' : 'text-slate-600 hover:text-slate-400'}`}>
              <MessageSquare size={13} />
            </button>
            <button onClick={() => onDelete(task.id)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover/hdr:opacity-100 transition-opacity p-0.5">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Notes */}
        {notesOpen && (
          <div className="px-3 pt-2 bg-slate-800/60">
            <textarea
              autoFocus
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs text-slate-300 outline-none resize-none"
              rows={2}
              placeholder="備注..."
              value={task.notes ?? ''}
              onChange={(e) => updateField({ notes: e.target.value })}
            />
          </div>
        )}

        {/* Body: sub-tasks */}
        {!collapsed && (
          <div className="bg-slate-900/60 divide-y divide-slate-800/60">
            {(task.subTasks ?? []).map((sub) => (
              <TaskRow
                key={sub.id}
                task={sub}
                depth={1}
                onPostpone={onPostpone}
                onAddSubTask={onAddSubTask}
                onDelete={onDelete}
                onChange={(updated) => {
                  onChange({ ...task, subTasks: task.subTasks!.map((s) => (s.id === updated.id ? updated : s)) });
                }}
              />
            ))}
            {addingSub ? (
              <div className="flex items-center gap-2 px-4 py-2 flex-wrap">
                <input
                  autoFocus
                  className="bg-slate-800 rounded px-2 py-1 text-sm flex-1 min-w-[8rem] outline-none"
                  placeholder="子任務名稱"
                  value={newSubTitle}
                  onChange={(e) => setNewSubTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitSubTask()}
                />
                <input
                  type="date"
                  className="bg-slate-800 rounded px-2 py-1 text-xs w-36 outline-none"
                  value={newSubDate}
                  onChange={(e) => setNewSubDate(e.target.value)}
                />
                <button onClick={submitSubTask} className="text-sm text-primary-400 hover:text-primary-300 px-2">新增</button>
                <button onClick={() => setAddingSub(false)} className="text-sm text-slate-500 hover:text-slate-300 px-1">取消</button>
              </div>
            ) : (
              <div className="px-4 py-2">
                <button onClick={() => setAddingSub(true)}
                  className="text-xs text-slate-500 hover:text-primary-400 flex items-center gap-1">
                  <Plus size={12} /> 新增子任務
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Leaf row (sub-task inside container, or standalone leaf) ──
  const isStandalone = depth === 0;
  return (
    <div className={isStandalone ? 'rounded-lg border border-slate-800 bg-slate-900/60' : ''}>
      <div className={`flex items-center gap-2 py-2.5 px-3 group/row ${isStandalone ? '' : 'hover:bg-slate-800/30 transition-colors'}`}>
        <div className="w-4 shrink-0 flex justify-center">
          {urgent && <Flame size={13} className="text-red-400" />}
        </div>

        <div className="w-20 shrink-0">
          <select
            className={`w-full bg-slate-800 rounded px-2 py-1 text-xs outline-none border ${STATUS_COLOR[task.status ?? '待辦']}`}
            value={task.status ?? '待辦'}
            onChange={(e) => updateField({ status: e.target.value as Task['status'] })}
          >
            <option value="待辦">待辦</option>
            <option value="進行中">進行中</option>
            <option value="已完成">已完成</option>
          </select>
        </div>

        <input
          className={`flex-1 min-w-[6rem] bg-transparent outline-none text-sm ${done ? 'line-through text-slate-500' : 'text-slate-200'}`}
          value={task.title}
          onChange={(e) => updateField({ title: e.target.value })}
        />

        <div className="flex items-center gap-2 shrink-0 text-xs text-slate-500">
          <input
            type="date"
            className="bg-slate-800 rounded px-1.5 py-0.5 text-xs outline-none"
            value={task.dueDate ?? ''}
            onChange={(e) => onPostpone(task.id, e.target.value)}
          />
          <button
            onClick={() => updateField({ urgent: !task.urgent })}
            className={`px-2 py-0.5 rounded border text-xs ${urgent ? 'bg-red-400/10 text-red-400 border-red-400/30' : 'bg-slate-800 text-slate-600 border-slate-700'}`}
          >
            急件
          </button>
          <button
            onClick={() => setNotesOpen((v) => !v)}
            className={`p-1 ${notesOpen || task.notes ? 'text-primary-400' : 'text-slate-600 hover:text-slate-400'}`}
          >
            <MessageSquare size={13} />
          </button>
          {isStandalone && (
            <button
              onClick={() => setAddingSub(true)}
              className="opacity-0 group-hover/row:opacity-100 transition-opacity text-slate-600 hover:text-primary-400 p-0.5"
              title="新增子任務"
            >
              <Plus size={13} />
            </button>
          )}
          <button onClick={() => onDelete(task.id)}
            className="opacity-0 group-hover/row:opacity-100 transition-opacity text-slate-600 hover:text-red-400 p-0.5">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {notesOpen && (
        <div className="px-3 pb-2">
          <textarea
            autoFocus
            className="w-full bg-slate-800/60 border border-slate-700 rounded px-3 py-2 text-xs text-slate-300 outline-none resize-none"
            rows={2}
            placeholder="備注..."
            value={task.notes ?? ''}
            onChange={(e) => updateField({ notes: e.target.value })}
          />
        </div>
      )}

      {isStandalone && addingSub && (
        <div className="flex items-center gap-2 px-3 pb-2 flex-wrap border-t border-slate-800 pt-2">
          <input
            autoFocus
            className="bg-slate-800 rounded px-2 py-1 text-sm flex-1 min-w-[8rem] outline-none"
            placeholder="子任務名稱"
            value={newSubTitle}
            onChange={(e) => setNewSubTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitSubTask()}
          />
          <input
            type="date"
            className="bg-slate-800 rounded px-2 py-1 text-xs w-36 outline-none"
            value={newSubDate}
            onChange={(e) => setNewSubDate(e.target.value)}
          />
          <button onClick={submitSubTask} className="text-sm text-primary-400 hover:text-primary-300 px-2">新增</button>
          <button onClick={() => setAddingSub(false)} className="text-sm text-slate-500 hover:text-slate-300 px-1">取消</button>
        </div>
      )}
    </div>
  );
}
