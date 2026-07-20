import type { Project, Task } from '../types';
import { flattenTaskLeaves, getEffectiveDueDate, getEffectiveStatus } from './taskUtils';

export type TaskPageTab = '全部' | '進行中' | '延遲' | '本週／之後' | '已完成';

export function getTasksForTab(tasks: Task[], tab: TaskPageTab, today: string): Task[] {
  return tasks.filter((task) => {
    const status = getEffectiveStatus(task);
    const dueDate = getEffectiveDueDate(task);

    switch (tab) {
      case '進行中':
        return status === '進行中';
      case '延遲':
        return status !== '已完成' && !!dueDate && dueDate < today;
      case '本週／之後':
        return status !== '已完成' && !!dueDate && dueDate >= today;
      case '已完成':
        return status === '已完成';
      case '全部':
        return true;
    }
  });
}

export function limitTaskPreview(tasks: Task[], limit = 5): Task[] {
  return tasks.slice(0, limit);
}

export function getInProgressTaskLeaves(tasks: Task[]): Task[] {
  return flattenTaskLeaves(tasks).filter((task) => getEffectiveStatus(task) === '進行中');
}

export function getDashboardTaskLeaves(tasks: Task[], parent?: Task, parentUrgent = false): Task[] {
  return tasks.flatMap((task) => {
    const urgent = parentUrgent || !!task.urgent;

    if (task.subTasks?.length) {
      return getDashboardTaskLeaves(task.subTasks, task, urgent);
    }

    return [{
      ...task,
      title: parent ? `${parent.title}－${task.title}` : task.title,
      urgent,
    }];
  });
}

export function getPendingTaskLeaves(tasks: Task[]): Task[] {
  return flattenTaskLeaves(tasks).filter((task) => {
    const status = getEffectiveStatus(task);
    return status !== '進行中' && status !== '已完成';
  });
}

export function getOverdueTaskLeaves(tasks: Task[], today: string): Task[] {
  return flattenTaskLeaves(tasks).filter((task) =>
    getEffectiveStatus(task) !== '已完成' && !!task.dueDate && task.dueDate < today
  );
}

export function getUpcomingTaskLeaves(tasks: Task[], today: string, weekEnd: string): Task[] {
  return getPendingTaskLeaves(tasks).filter(
    (task) => !!task.dueDate && task.dueDate >= today && task.dueDate <= weekEnd
  );
}

export function sortTasksByDueDate(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) =>
    (a.dueDate ?? '9999-99-99').localeCompare(b.dueDate ?? '9999-99-99')
  );
}

export function getTaskProjectName(task: Task, projects: Project[]): string {
  return projects.find((project) => project.id === task.projectId)?.name ?? '未歸屬專案';
}
