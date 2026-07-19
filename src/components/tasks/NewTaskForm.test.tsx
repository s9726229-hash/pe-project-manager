import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Project } from '../../types';
import { DEFAULT_PROJECT_ID } from '../../hooks/useProjects';
import NewTaskForm from './NewTaskForm';

function project(overrides: Partial<Project>): Project {
  return {
    id: 'project-1',
    name: 'Project One',
    productLine: '',
    grade: '',
    startDate: '2026-01-01',
    appliedTemplateId: '',
    status: '進行中',
    owner: '',
    notes: '',
    milestones: [],
    ...overrides,
  };
}

describe('NewTaskForm', () => {
  it('creates a task under the selected active project', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    const misc = project({ id: DEFAULT_PROJECT_ID, name: '日常行政/雜項' });
    const alpha = project({ id: 'alpha', name: 'Alpha' });

    render(<NewTaskForm projects={[misc, alpha]} onCreate={onCreate} />);

    await user.selectOptions(screen.getByLabelText('選擇所屬專案'), 'alpha');
    await user.type(screen.getByPlaceholderText('新增待辦事項...'), '處理 DFM 審核');
    await user.click(screen.getByRole('button', { name: '新增' }));

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 'alpha', title: '處理 DFM 審核' }),
    );
  });

  it('does not offer completed or cancelled projects', () => {
    const onCreate = vi.fn();
    const misc = project({ id: DEFAULT_PROJECT_ID, name: '日常行政/雜項' });
    const completed = project({ id: 'completed', name: 'Completed', status: '已完成' });
    const cancelled = project({ id: 'cancelled', name: 'Cancelled', status: '取消' });

    render(<NewTaskForm projects={[misc, completed, cancelled]} onCreate={onCreate} />);

    expect(screen.queryByRole('option', { name: 'Completed' })).toBeNull();
    expect(screen.queryByRole('option', { name: 'Cancelled' })).toBeNull();
  });
});
