import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TemplateStep } from '../../types';
import StepEditor from './StepEditor';

afterEach(cleanup);

const steps: TemplateStep[] = [{
  id: 'phase', name: '工程階段', groupOrder: 1, subSteps: [
    { id: 'design', name: '設計', groupOrder: 1, durationDays: 3 },
    { id: 'review', name: '審查', groupOrder: 1, durationDays: 1 },
    { id: 'build', name: '製作', groupOrder: 2, durationDays: 2 },
  ],
}];

describe('StepEditor', () => {
  it('changes group order when moving a group', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StepEditor steps={[
      steps[0],
      { id: 'release', name: '發布階段', groupOrder: 2, subSteps: [{ id: 'ship', name: '發布', groupOrder: 1, durationDays: 1 }] },
    ]} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: '工程階段移到下一組' }));

    expect(onChange).toHaveBeenLastCalledWith(expect.arrayContaining([
      expect.objectContaining({ id: 'phase', groupOrder: 2 }),
      expect.objectContaining({ id: 'release', groupOrder: 1 }),
    ]));
  });

  it('shows clear group headers and only exposes durations as numeric fields', () => {
    render(<StepEditor steps={steps} onChange={vi.fn()} />);

    expect(screen.getByText('第 1 組')).toBeTruthy();
    expect(screen.getByText('並行啟動')).toBeTruthy();
    expect(screen.getByText('群組工期 3 天')).toBeTruthy();
    expect(screen.getAllByRole('spinbutton')).toHaveLength(3);
    expect(screen.queryByText(/群組\s*\d/)).toBeNull();
  });

  it('moves a task to its next group and adds a task parallel to its group', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StepEditor steps={steps} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: '設計移到下一組' }));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({
      0: expect.objectContaining({ subSteps: expect.arrayContaining([expect.objectContaining({ id: 'design', groupOrder: 2 })]) }),
    }));

    await user.click(screen.getByRole('button', { name: '審查加入同組並行任務' }));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({
      0: expect.objectContaining({ subSteps: expect.arrayContaining([expect.objectContaining({ groupOrder: 1, name: '新子步驟' })]) }),
    }));
  });
});
