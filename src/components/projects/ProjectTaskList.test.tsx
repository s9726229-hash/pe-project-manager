import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Task } from '../../types';
import ProjectTaskList from './ProjectTaskList';

const task = (overrides: Partial<Task>): Task => ({
  id: 'task',
  projectId: 'alpha',
  title: 'Task',
  status: '待辦',
  ...overrides,
});

describe('ProjectTaskList', () => {
  afterEach(cleanup);

  it('shows only tasks linked to the current project', () => {
    render(<ProjectTaskList projectId="alpha" tasks={[
      task({ id: 'alpha-task', title: 'Alpha 隞餃?' }),
      task({ id: 'beta-task', projectId: 'beta', title: 'Beta 隞餃?' }),
    ]} />);

    expect(screen.getByText('Alpha 隞餃?')).toBeTruthy();
    expect(screen.queryByText('Beta 隞餃?')).toBeNull();
  });

  it('orders linked tasks by due date', () => {
    render(<ProjectTaskList
      projectId="alpha"
      tasks={[
        task({ id: 'later', title: 'Later', dueDate: '2026-08-01' }),
        task({ id: 'sooner', title: 'Sooner', dueDate: '2026-07-01' }),
      ]}
    />);

    const titles = screen.getAllByRole('textbox').map((element) => (element as HTMLInputElement).value);
    expect(titles).toEqual(['Sooner', 'Later']);
  });

  it('explains when the project has no linked tasks', () => {
    render(<ProjectTaskList projectId="alpha" tasks={[task({ projectId: 'beta' })]} />);

    expect(screen.getByText('此專案尚未連結任何任務。')).toBeTruthy();
  });
});
