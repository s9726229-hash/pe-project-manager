import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Project, Task } from '../types';
import Dashboard from './Dashboard';

const project: Project = {
  id: 'project-1',
  name: 'Alpha',
  productLine: '',
  grade: '',
  startDate: '2026-01-01',
  appliedTemplateId: '',
  status: '進行中',
  owner: '',
  notes: '',
  milestones: [],
};

const task = (overrides: Partial<Task>): Task => ({
  id: 'task-1',
  projectId: 'project-1',
  title: 'Task',
  status: '待辦',
  ...overrides,
});

describe('Dashboard workbench', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('prioritizes every overdue task and in-progress task before upcoming work', () => {
    vi.setSystemTime(new Date('2026-07-20T12:00:00Z'));

    render(
      <Dashboard
        tasksApi={{
          tasks: [
            task({ id: 'late-one', title: 'Late one', dueDate: '2026-07-19' }),
            task({ id: 'late-two', title: 'Late two', dueDate: '2026-07-20' }),
            task({ id: 'doing', title: 'In progress', status: '進行中', dueDate: '2026-07-21' }),
            task({ id: 'later', title: 'Later task', dueDate: '2026-08-01' }),
          ],
          setStatus: vi.fn(),
          addTask: vi.fn(),
        } as never}
        projectsApi={{ projects: [project] } as never}
        casesApi={{}}
        programsApi={{ programs: [] } as never}
        onOpenProject={vi.fn()}
        onOpenTasks={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: /立即處理/ })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /專案狀態/ })).toBeTruthy();
    expect(screen.getByText('Late one')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: /待辦/ }));
    expect(screen.getByText('Late two')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: /進行中/ }));
    expect(screen.getByText('In progress')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: /尚未啟動/ }));
    expect(screen.getByText('Later task')).toBeTruthy();
  });

  it('keeps the all-tasks action available from the later-work summary', () => {
    vi.setSystemTime(new Date('2026-07-20T12:00:00Z'));
    const onOpenTasks = vi.fn();

    render(
      <Dashboard
        tasksApi={{ tasks: [task({ dueDate: '2026-08-01' })], setStatus: vi.fn(), addTask: vi.fn() } as never}
        projectsApi={{ projects: [project] } as never}
        casesApi={{}}
        programsApi={{ programs: [] } as never}
        onOpenProject={vi.fn()}
        onOpenTasks={onOpenTasks}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '查看全部任務 →' }));
    expect(onOpenTasks).toHaveBeenCalledOnce();
  });

  it('shows task buckets as tabs and omits the default misc project label', () => {
    vi.setSystemTime(new Date('2026-07-20T12:00:00Z'));

    render(
      <Dashboard
        tasksApi={{
          tasks: [
            task({ id: 'overdue', title: 'Overdue task', dueDate: '2026-07-19' }),
            task({ id: 'todo', title: 'This week task', dueDate: '2026-07-21' }),
            task({ id: 'doing', title: 'Doing task', status: '進行中', dueDate: '2026-08-01' }),
            task({ id: 'later', title: 'Later task', dueDate: '2026-08-01' }),
            task({ id: 'misc', title: 'Misc task', projectId: 'default-misc-project', dueDate: '2026-07-21' }),
          ],
          setStatus: vi.fn(),
          addTask: vi.fn(),
        } as never}
        projectsApi={{ projects: [project, { ...project, id: 'default-misc-project', name: '日常雜項' }] } as never}
        casesApi={{}}
        programsApi={{ programs: [] } as never}
        onOpenProject={vi.fn()}
        onOpenTasks={vi.fn()}
      />
    );

    expect(screen.getByRole('tab', { name: /延遲/ })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /待辦/ })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /進行中/ })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /尚未啟動/ })).toBeTruthy();
    expect(screen.getByText('Overdue task')).toBeTruthy();
    expect(screen.queryByText('日常雜項')).toBeNull();

    fireEvent.click(screen.getByRole('tab', { name: /待辦/ }));
    expect(screen.getByText('This week task')).toBeTruthy();
    expect(screen.getByText('Misc task')).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: /進行中/ }));
    expect(screen.getByText('Doing task')).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: /尚未啟動/ }));
    expect(screen.getByText('Later task')).toBeTruthy();
  });

  it('shows parent context, compact due metadata, and overdue-day detail for every overdue leaf', () => {
    vi.setSystemTime(new Date('2026-07-20T12:00:00Z'));

    render(
      <Dashboard
        tasksApi={{
          tasks: [
            task({
              id: 'parent',
              title: 'Parent task',
              urgent: true,
              subTasks: [
                task({ id: 'child', title: 'Child task', dueDate: '2026-07-18', urgent: false }),
                task({ id: 'second-child', title: 'Second child', dueDate: '2026-07-19' }),
              ],
            }),
            task({ id: 'standalone', title: 'Standalone task', dueDate: '2026-07-17' }),
          ],
          setStatus: vi.fn(),
          addTask: vi.fn(),
        } as never}
        projectsApi={{ projects: [project] } as never}
        casesApi={{}}
        programsApi={{ programs: [] } as never}
        onOpenProject={vi.fn()}
        onOpenTasks={vi.fn()}
      />,
    );

    expect(screen.getByRole('tab', { name: '延遲 3' })).toBeTruthy();
    expect(screen.getByText('Parent task－Child task')).toBeTruthy();
    expect(screen.getByText('Parent task－Second child')).toBeTruthy();
    expect(screen.getByText('Standalone task')).toBeTruthy();
    expect(screen.getByText('逾期 2 天')).toBeTruthy();
    expect(screen.getByText('逾期 1 天')).toBeTruthy();
    expect(screen.getByText('逾期 3 天')).toBeTruthy();
    expect(screen.getAllByLabelText('緊急')).toHaveLength(2);
  });
});
