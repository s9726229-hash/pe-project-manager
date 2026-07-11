import { useState } from 'react';
import type { useTasks } from '../hooks/useTasks';
import type { useProjects } from '../hooks/useProjects';
import type { Task } from '../types';
import { getEffectiveDueDate, getEffectiveStatus } from '../services/taskUtils';
import TaskRow from '../components/tasks/TaskRow';
import NewTaskForm from '../components/tasks/NewTaskForm';

interface TasksProps {
  tasksApi: ReturnType<typeof useTasks>;
  projectsApi: ReturnType<typeof useProjects>;
}

export default function Tasks({ tasksApi }: TasksProps) {
  const { tasks, addTask, updateTask, postponeTask, addSubTask, deleteTask } = tasksApi;

  const [showCompleted, setShowCompleted] = useState(false);

  const visibleTasks = showCompleted ? tasks : tasks.filter((t) => getEffectiveStatus(t) !== '已完成');

  function updateTopLevelTask(updated: Task) {
    updateTask(updated.id, updated);
  }

  const sortedByDate = [...visibleTasks].sort((a, b) => {
    const da = getEffectiveDueDate(a) ?? '9999-99-99';
    const db = getEffectiveDueDate(b) ?? '9999-99-99';
    return da.localeCompare(db);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">待辦事項</h1>
        <label className="text-xs text-slate-400 flex items-center gap-1">
          <input type="checkbox" checked={showCompleted} onChange={(e) => setShowCompleted(e.target.checked)} />
          顯示已完成
        </label>
      </div>

      <NewTaskForm onCreate={addTask} />

      {/* 欄位標題列，跟 TaskRow 的欄寬對齊；滾動時固定在頂端方便對照 */}
      <div className="sticky top-0 z-10 flex items-center gap-2 py-1.5 px-3 mb-2 text-xs text-slate-500 bg-slate-950/95 backdrop-blur">
        <div className="w-20 shrink-0">狀態</div>
        <div className="w-4 shrink-0" />
        <div className="flex-1 min-w-[6rem]">任務名稱</div>
        <div className="w-32 shrink-0">完成日</div>
        <div className="w-14 shrink-0">急迫度</div>
        <div className="w-8 shrink-0">備注</div>
        <div className="w-8 shrink-0" />
        <div className="w-8 shrink-0" />
      </div>

      {visibleTasks.length === 0 && <p className="text-slate-500 text-sm">目前沒有待辦事項。</p>}

      <div className="space-y-2">
        {sortedByDate.map((t) => (
          <TaskRow
            key={t.id}
            task={t}
            onChange={updateTopLevelTask}
            onPostpone={postponeTask}
            onAddSubTask={addSubTask}
            onDelete={deleteTask}
          />
        ))}
      </div>
    </div>
  );
}
