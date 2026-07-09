import type { Task } from '../types';

// 有子任務的父項目不記錄自己的狀態/到期日，一律由子任務推算——跟 Milestone 同邏輯，
// 但子任務是扁平、無序的清單，不需要並行分組。

export function isParentTask(t: Task): boolean {
  return !!t.subTasks && t.subTasks.length > 0;
}

export function isTaskDone(t: Task): boolean {
  if (isParentTask(t)) return t.subTasks!.every(isTaskDone);
  return t.status === '已完成';
}

// 父項目沒有自己的到期日，取子任務裡最早的到期日（最急迫的那個）代表整組。
export function getEffectiveDueDate(t: Task): string | undefined {
  if (!isParentTask(t)) return t.dueDate;
  const dates = t.subTasks!.map(getEffectiveDueDate).filter((d): d is string => !!d);
  return dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : undefined;
}

export function getEffectiveStatus(t: Task): Task['status'] {
  if (!isParentTask(t)) return t.status ?? '待辦';
  if (isTaskDone(t)) return '已完成';
  return t.subTasks!.some((s) => getEffectiveStatus(s) === '進行中') ? '進行中' : '待辦';
}

export function isTaskUrgent(t: Task): boolean {
  if (!isParentTask(t)) return !!t.urgent;
  return t.subTasks!.some(isTaskUrgent);
}

export function findTaskById(tasks: Task[], id: string): Task | undefined {
  for (const t of tasks) {
    if (t.id === id) return t;
    if (t.subTasks) {
      const found = findTaskById(t.subTasks, id);
      if (found) return found;
    }
  }
  return undefined;
}

export function updateTaskById(tasks: Task[], id: string, updater: (t: Task) => Task): Task[] {
  return tasks.map((t) => {
    if (t.id === id) return updater(t);
    if (t.subTasks) return { ...t, subTasks: updateTaskById(t.subTasks, id, updater) };
    return t;
  });
}

export function flattenTaskLeaves(tasks: Task[]): Task[] {
  const leaves: Task[] = [];
  for (const t of tasks) {
    if (isParentTask(t)) leaves.push(...flattenTaskLeaves(t.subTasks!));
    else leaves.push(t);
  }
  return leaves;
}

export function removeTaskById(tasks: Task[], id: string): Task[] {
  return tasks
    .filter((t) => t.id !== id)
    .map((t) => (t.subTasks ? { ...t, subTasks: removeTaskById(t.subTasks, id) } : t));
}
