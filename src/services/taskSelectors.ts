import type { Project, Task } from '../types';
import { flattenTaskLeaves, getEffectiveStatus } from './taskUtils';

export function getInProgressTaskLeaves(tasks: Task[]): Task[] {
  return flattenTaskLeaves(tasks).filter((task) => getEffectiveStatus(task) === '進行中');
}

export function sortTasksByDueDate(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) =>
    (a.dueDate ?? '9999-99-99').localeCompare(b.dueDate ?? '9999-99-99')
  );
}

export function getTaskProjectName(task: Task, projects: Project[]): string {
  return projects.find((project) => project.id === task.projectId)?.name ?? '未指派專案';
}
