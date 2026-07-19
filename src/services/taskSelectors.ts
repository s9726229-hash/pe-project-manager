import type { Project, Task } from '../types';
import { flattenTaskLeaves, getEffectiveStatus } from './taskUtils';

export function getInProgressTaskLeaves(tasks: Task[]): Task[] {
  return flattenTaskLeaves(tasks).filter((task) => getEffectiveStatus(task) === '進行中');
}

export function getPendingTaskLeaves(tasks: Task[]): Task[] {
  return flattenTaskLeaves(tasks).filter((task) => {
    const status = getEffectiveStatus(task);
    return status !== '進行中' && status !== '已完成';
  });
}

export function sortTasksByDueDate(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) =>
    (a.dueDate ?? '9999-99-99').localeCompare(b.dueDate ?? '9999-99-99')
  );
}

export function getTaskProjectName(task: Task, projects: Project[]): string {
  return projects.find((project) => project.id === task.projectId)?.name ?? '未歸屬專案';
}
