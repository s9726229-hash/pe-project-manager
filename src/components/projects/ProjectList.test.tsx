import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Program, Project } from '../../types';
import ProjectList from './ProjectList';

const program: Program = { id: 'e28', name: 'E28' };

const project = (overrides: Partial<Project> = {}): Project => ({
  id: 'e28-child',
  name: 'E28 Child Project',
  productLine: 'Platform and Systems',
  grade: 'A',
  startDate: '2026-01-01',
  appliedTemplateId: '',
  status: '' as Project['status'],
  owner: '',
  notes: 'Retain this note',
  programId: 'e28',
  milestones: [{
    id: 'gate',
    name: 'Gate 1',
    groupOrder: 1,
    subMilestones: [{ id: 'review', name: 'Design Review', groupOrder: 1, status: '' as never }],
  }],
  ...overrides,
});

describe('ProjectList program groups', () => {
  afterEach(cleanup);

  it('shows a default-expanded group with summary metrics and two-line current stage', () => {
    render(
      <ProjectList
        projects={[project()]}
        programs={[program]}
        onOpen={vi.fn()}
        onNewProject={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /E28.*1.*0%.*1/ }).getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('E28 Child Project')).toBeTruthy();
    expect(screen.getByText('Platform and Systems').className).toContain('whitespace-normal');
    expect(screen.getByText('Gate 1')).toBeTruthy();
    expect(screen.getByText('Next: Design Review')).toBeTruthy();
  });

  it('hides child rows while retaining the accessible program summary when collapsed', async () => {
    const user = userEvent.setup();
    render(
      <ProjectList
        projects={[project()]}
        programs={[program]}
        onOpen={vi.fn()}
        onNewProject={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const toggle = screen.getByRole('button', { name: /E28.*1.*0%.*1/ });
    await user.click(toggle);

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText('E28 Child Project')).toBeNull();
    expect(toggle.getAttribute('aria-label')).toMatch(/E28.*1.*0%.*1/);
  });
});
