import { describe, expect, it } from 'vitest';
import type { Project, Task } from '../types';
import {
  getInProgressTaskLeaves,
  getPendingTaskLeaves,
  getTaskProjectName,
  sortTasksByDueDate,
} from './taskSelectors';

const task = (overrides: Partial<Task>): Task => ({
  id: 'task-1',
  projectId: 'project-1',
  title: 'Task',
  ...overrides,
});

const project = (overrides: Partial<Project>): Project => ({
  id: 'project-1',
  name: 'Project One',
  productLine: 'Line',
  grade: 'Grade',
  startDate: '2026-01-01',
  appliedTemplateId: 'template-1',
  status: '進行中',
  owner: 'Owner',
  notes: '',
  milestones: [],
  ...overrides,
});

describe('taskSelectors', () => {
  it('returns only in-progress leaf tasks', () => {
    const childInProgress = task({ id: 'child-in-progress', status: '進行中' });
    const childTodo = task({ id: 'child-todo', status: '待辦' });
    const tasks = [
      task({ id: 'parent', status: '進行中', subTasks: [childInProgress, childTodo] }),
      task({ id: 'completed', status: '已完成' }),
    ];

    expect(getInProgressTaskLeaves(tasks)).toEqual([childInProgress]);
  });

  it('keeps waiting and todo leaves pending while excluding in-progress and completed leaves', () => {
    const waiting = task({ id: 'waiting' });
    const todo = task({ id: 'todo', status: '待辦' });
    const inProgress = task({ id: 'in-progress', status: '進行中' });
    const completed = task({ id: 'completed', status: '已完成' });

    expect(getPendingTaskLeaves([waiting, todo, inProgress, completed])).toEqual([waiting, todo]);
  });

  it('sorts dated tasks ascending before undated tasks without mutating input', () => {
    const tasks = [
      task({ id: 'undated' }),
      task({ id: 'late', dueDate: '2026-07-22' }),
      task({ id: 'early', dueDate: '2026-07-21' }),
    ];

    expect(sortTasksByDueDate(tasks).map(({ id }) => id)).toEqual(['early', 'late', 'undated']);
    expect(tasks.map(({ id }) => id)).toEqual(['undated', 'late', 'early']);
  });

  it('returns the matching project name or the unassigned-project label', () => {
    const projects = [project({ id: 'project-1', name: 'Alpha' })];

    expect(getTaskProjectName(task({ projectId: 'project-1' }), projects)).toBe('Alpha');
    expect(getTaskProjectName(task({ projectId: 'unknown' }), projects)).toBe('未歸屬專案');
  });
});
