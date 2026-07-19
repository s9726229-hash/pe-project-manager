import type { Task } from '../../types';
import { sortTasksByDueDate } from '../../services/taskSelectors';
import TaskRow from '../tasks/TaskRow';

interface ProjectTaskListProps {
  projectId: string;
  tasks: Task[];
  onChange?: (task: Task) => void;
  onPostpone?: (id: string, newDate: string) => void;
  onAddSubTask?: (parentId: string, title: string, dueDate?: string) => void;
  onDelete?: (id: string) => void;
}

const noop = () => undefined;

export default function ProjectTaskList({
  projectId,
  tasks,
  onChange = noop,
  onPostpone = noop,
  onAddSubTask = noop,
  onDelete = noop,
}: ProjectTaskListProps) {
  const projectTasks = sortTasksByDueDate(tasks.filter((task) => task.projectId === projectId));

  if (projectTasks.length === 0) {
    return <p className="py-2 text-sm text-slate-500">此專案尚未連結任何任務。</p>;
  }

  return (
    <div className="space-y-2">
      {projectTasks.map((task) => (
        <div key={task.id}>
          <span className="sr-only">{task.title}</span>
          <TaskRow
            task={task}
            onChange={onChange}
            onPostpone={onPostpone}
            onAddSubTask={onAddSubTask}
            onDelete={onDelete}
          />
        </div>
      ))}
    </div>
  );
}
