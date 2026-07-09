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

type ViewMode = 'date' | 'project';

export default function Tasks({ tasksApi, projectsApi }: TasksProps) {
  const { tasks, addTask, updateTask, postponeTask, addSubTask, deleteTask } = tasksApi;
  const { projects } = projectsApi;

  const [mode, setMode] = useState<ViewMode>('date');
  const [showCompleted, setShowCompleted] = useState(false);

  const projectById = new Map(projects.map((p) => [p.id, p]));
  const visibleTasks = showCompleted ? tasks : tasks.filter((t) => getEffectiveStatus(t) !== '已完成');

  function updateTopLevelTask(updated: Task) {
    updateTask(updated.id, updated);
  }

  function renderRow(t: Task, showProjectTag: boolean) {
    return (
      <TaskRow
        key={t.id}
        task={t}
        project={projectById.get(t.projectId)}
        showProjectTag={showProjectTag}
        onChange={updateTopLevelTask}
        onPostpone={postponeTask}
        onAddSubTask={addSubTask}
        onDelete={deleteTask}
      />
    );
  }

  const sortedByDate = [...visibleTasks].sort((a, b) => {
    const da = getEffectiveDueDate(a) ?? '9999-99-99';
    const db = getEffectiveDueDate(b) ?? '9999-99-99';
    return da.localeCompare(db);
  });

  const grouped = projects
    .map((p) => ({ project: p, items: visibleTasks.filter((t) => t.projectId === p.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">待辦事項</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('date')}
            className={`text-xs px-3 py-1.5 rounded-lg border ${mode === 'date' ? 'border-primary-500 text-primary-400' : 'border-slate-700 text-slate-400'}`}
          >
            依到期日
          </button>
          <button
            onClick={() => setMode('project')}
            className={`text-xs px-3 py-1.5 rounded-lg border ${mode === 'project' ? 'border-primary-500 text-primary-400' : 'border-slate-700 text-slate-400'}`}
          >
            依專案分組
          </button>
          <label className="text-xs text-slate-400 flex items-center gap-1 ml-2">
            <input type="checkbox" checked={showCompleted} onChange={(e) => setShowCompleted(e.target.checked)} />
            顯示已完成
          </label>
        </div>
      </div>

      <NewTaskForm projects={projects} onCreate={addTask} />

      {visibleTasks.length === 0 && <p className="text-slate-500 text-sm">目前沒有待辦事項。</p>}

      {mode === 'date' && <div className="space-y-2">{sortedByDate.map((t) => renderRow(t, true))}</div>}

      {mode === 'project' && (
        <div className="space-y-6">
          {grouped.map(({ project, items }) => (
            <div key={project.id}>
              <h2 className="text-sm font-semibold text-slate-300 mb-2">{project.name}</h2>
              <div className="space-y-2">{items.map((t) => renderRow(t, false))}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
