import { describe, expect, it } from 'vitest';
import type { Project, Task } from '../types';
import {
  getTasksForTab,
  getInProgressTaskLeaves,
  getPendingTaskLeaves,
  getTaskProjectName,
  getOverdueTaskLeaves,
  getUpcomingTaskLeaves,
  limitTaskPreview,
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
  it('classifies top-level tasks for task-page tabs using effective status and due dates', () => {
    const today = '2026-07-20';
    const parentInProgress = task({
      id: 'parent-in-progress',
      subTasks: [task({ id: 'child-doing', status: '進行中' })],
    });
    const completedParent = task({
      id: 'completed-parent',
      subTasks: [task({ id: 'child-done', status: '已完成' })],
    });
    const overdue = task({ id: 'overdue', dueDate: '2026-07-19' });
    const upcoming = task({ id: 'upcoming', dueDate: '2026-07-20' });
    const undated = task({ id: 'undated' });
    const tasks = [parentInProgress, completedParent, overdue, upcoming, undated];

    expect(getTasksForTab(tasks, '進行中', today)).toEqual([parentInProgress]);
    expect(getTasksForTab(tasks, '延遲', today)).toEqual([overdue]);
    expect(getTasksForTab(tasks, '本週／之後', today)).toEqual([upcoming]);
    expect(getTasksForTab(tasks, '已完成', today)).toEqual([completedParent]);
    expect(getTasksForTab(tasks, '全部', today)).toEqual(tasks);
  });

  it('limits dashboard category previews without changing the source list', () => {
    const tasks = [task({ id: '1' }), task({ id: '2' }), task({ id: '3' })];

    expect(limitTaskPreview(tasks, 2).map(({ id }) => id)).toEqual(['1', '2']);
    expect(tasks.map(({ id }) => id)).toEqual(['1', '2', '3']);
  });

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

  it('selects unfinished overdue leaf tasks through the current date', () => {
    const overdue = task({ id: 'overdue', dueDate: '2026-07-19' });
    const dueToday = task({ id: 'today', dueDate: '2026-07-20' });
    const future = task({ id: 'future', dueDate: '2026-07-21' });
    const completed = task({ id: 'completed', dueDate: '2026-07-19', status: '已完成' });
    const inProgress = task({ id: 'in-progress', dueDate: '2026-07-19', status: '進行中' });

    expect(getOverdueTaskLeaves([overdue, dueToday, future, completed, inProgress], '2026-07-20'))
      .toEqual([overdue, dueToday]);
  });

  it('selects today and the remainder of the week without completed or in-progress tasks', () => {
    const today = task({ id: 'today', dueDate: '2026-07-20' });
    const sunday = task({ id: 'sunday', dueDate: '2026-07-26' });
    const nextWeek = task({ id: 'next-week', dueDate: '2026-07-27' });
    const completed = task({ id: 'completed', dueDate: '2026-07-21', status: '已完成' });
    const inProgress = task({ id: 'in-progress', dueDate: '2026-07-21', status: '進行中' });

    expect(getUpcomingTaskLeaves([today, sunday, nextWeek, completed, inProgress], '2026-07-20', '2026-07-26'))
      .toEqual([today, sunday]);
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
