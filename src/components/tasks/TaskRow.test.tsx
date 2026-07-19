import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Task } from '../../types';
import TaskRow from './TaskRow';

const child: Task = {
  id: 'child',
  projectId: 'project-1',
  title: 'Child task',
  status: '待辦',
};

const parent: Task = {
  id: 'parent',
  projectId: 'project-1',
  title: 'Parent task',
  subTasks: [child],
};

describe('TaskRow notes', () => {
  it('uses the current-progress note text for both parent and leaf controls', async () => {
    const user = userEvent.setup();

    render(
      <TaskRow
        task={parent}
        onChange={vi.fn()}
        onPostpone={vi.fn()}
        onAddSubTask={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const controls = screen.getAllByTitle('目前進度／備註');
    expect(controls).toHaveLength(2);
    await user.click(controls[0]);
    await user.click(controls[1]);

    expect(screen.getAllByLabelText('目前進度／備註')).toHaveLength(2);
    expect(screen.getAllByPlaceholderText('記錄目前情況、阻塞點或下一步…')).toHaveLength(2);
  });
});
