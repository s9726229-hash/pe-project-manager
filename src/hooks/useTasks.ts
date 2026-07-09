import { useEffect, useState } from 'react';
import type { Task, TaskRecurring } from '../types';
import { loadFromStorage, newId, saveToStorage, STORAGE_KEYS } from '../services/storage';
import { removeTaskById, updateTaskById } from '../services/taskUtils';

export interface NewTaskInput {
  projectId: string;
  title: string;
  dueDate?: string;
  urgent?: boolean;
  recurring?: TaskRecurring;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => loadFromStorage(STORAGE_KEYS.tasks, [] as Task[]));

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.tasks, tasks);
  }, [tasks]);

  function addTask(input: NewTaskInput) {
    const task: Task = {
      id: newId(),
      projectId: input.projectId,
      title: input.title,
      dueDate: input.dueDate,
      status: '待辦',
      urgent: input.urgent ?? false,
      recurring: input.recurring
    };
    setTasks((prev) => [...prev, task]);
    return task.id;
  }

  function updateTask(id: string, patch: Partial<Task>) {
    setTasks((prev) => updateTaskById(prev, id, (t) => ({ ...t, ...patch })));
  }

  function setStatus(id: string, status: Task['status']) {
    updateTask(id, { status, completedAt: status === '已完成' ? new Date().toISOString().slice(0, 10) : undefined });
  }

  // 順延到期日：記錄一筆順延歷史，原因選填。
  function postponeTask(id: string, newDate: string, reason?: string) {
    setTasks((prev) =>
      updateTaskById(prev, id, (t) => {
        if (!t.dueDate) return { ...t, dueDate: newDate };
        const entry = { oldDate: t.dueDate, newDate, reason };
        return { ...t, dueDate: newDate, postponeHistory: [...(t.postponeHistory ?? []), entry] };
      })
    );
  }

  function addSubTask(parentId: string, title: string) {
    setTasks((prev) =>
      updateTaskById(prev, parentId, (t) => ({
        ...t,
        subTasks: [
          ...(t.subTasks ?? []),
          { id: newId(), projectId: t.projectId, title, status: '待辦' }
        ],
        // 一旦有子任務，父項目自己的狀態/到期日就不算數，改由子任務推算——跟 Milestone 群組規則一樣。
        dueDate: undefined,
        status: undefined,
        urgent: undefined,
        recurring: undefined,
        postponeHistory: undefined,
        completedAt: undefined
      }))
    );
  }

  function deleteTask(id: string) {
    setTasks((prev) => removeTaskById(prev, id));
  }

  return { tasks, addTask, updateTask, setStatus, postponeTask, addSubTask, deleteTask };
}
