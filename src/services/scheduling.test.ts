import { describe, expect, it } from 'vitest';
import type { Milestone, TemplateStep } from '../types';
import { applyTemplateSteps, rescheduleFromStart } from './scheduling';

describe('template scheduling', () => {
  it('uses calendar days for parallel groups and starts the next group at the longest end date', () => {
    const steps: TemplateStep[] = [
      { id: 'design', name: 'Design', groupOrder: 1, durationDays: 3 },
      { id: 'review', name: 'Review', groupOrder: 1, durationDays: 1 },
      { id: 'build', name: 'Build', groupOrder: 2, durationDays: 2 },
    ];

    const milestones = applyTemplateSteps(steps, '2026-07-03');

    expect(milestones.map(({ id, plannedStartDate, plannedDate }) => ({ id, plannedStartDate, plannedDate }))).toEqual([
      { id: 'design', plannedStartDate: '2026-07-03', plannedDate: '2026-07-06' },
      { id: 'review', plannedStartDate: '2026-07-03', plannedDate: '2026-07-04' },
      { id: 'build', plannedStartDate: '2026-07-06', plannedDate: '2026-07-08' },
    ]);
  });

  it('reschedules with calendar days without discarding persisted milestone fields', () => {
    const milestones: Milestone[] = [
      {
        id: 'first', name: 'First', groupOrder: 1, durationDays: 2,
        status: '進行中', actualDate: '2026-07-04', owner: 'Amy',
        checklistItems: [{ id: 'check-1', label: 'Keep me', done: true }],
      },
      { id: 'second', name: 'Second', groupOrder: 2, durationDays: 1, status: '待辦' },
    ];

    const result = rescheduleFromStart(milestones, '2026-07-03');

    expect(result[0]).toMatchObject({
      plannedStartDate: '2026-07-03', plannedDate: '2026-07-05', status: '進行中',
      actualDate: '2026-07-04', owner: 'Amy', checklistItems: [{ id: 'check-1', label: 'Keep me', done: true }],
    });
    expect(result[1]).toMatchObject({ plannedStartDate: '2026-07-05', plannedDate: '2026-07-06' });
  });
});
