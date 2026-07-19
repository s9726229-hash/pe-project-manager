import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Project, Task } from '../../types';
import InProgressTaskList from './InProgressTaskList';

const alpha: Project = {
  id: 'alpha',
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

const task = (overrides: Partial<Task> = {}): Task => ({
  id: 'doing',
  projectId: 'alpha',
  title: 'Review TDR',
  status: '進行中',
  dueDate: '2026-07-21',
  urgent: true,
  ...overrides,
});

describe('InProgressTaskList', () => {
  it('shows task context and completes the selected task', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();

    render(<InProgressTaskList tasks={[task()]} projects={[alpha]} onComplete={onComplete} />);

    expect(screen.getByText('Review TDR')).toBeTruthy();
    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.getByText('2026-07-21')).toBeTruthy();
    expect(screen.getByText('緊急')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: '完成 Review TDR' }));
    expect(onComplete).toHaveBeenCalledWith('doing');
  });

  it('uses the selector fallback for tasks whose project no longer exists', () => {
    render(<InProgressTaskList tasks={[task({ projectId: 'deleted', dueDate: undefined, urgent: false })]} projects={[]} onComplete={vi.fn()} />);

    expect(screen.getByText('未歸屬專案')).toBeTruthy();
    expect(screen.getByText('無到期日')).toBeTruthy();
  });

  it('explains when no tasks are in progress', () => {
    render(<InProgressTaskList tasks={[]} projects={[alpha]} onComplete={vi.fn()} />);

    expect(screen.getByText('目前沒有進行中的任務。')).toBeTruthy();
  });
});
