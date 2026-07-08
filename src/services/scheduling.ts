import type { ChecklistItem, Milestone, TemplateStep } from '../types';
import { newId } from './storage';

// 只跳過週六日，不排除國定假日（已跟使用者確認過）。
export function addWorkingDays(start: Date, days: number): Date {
  const d = new Date(start);
  if (days <= 0) return d;
  let remaining = days;
  while (remaining > 0) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) remaining--;
  }
  return d;
}

export function toDateOnlyString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function toChecklist(labels: string[] | undefined): ChecklistItem[] | undefined {
  if (!labels || labels.length === 0) return undefined;
  return labels.map((label) => ({ id: newId(), label, done: false }));
}

interface ScheduleResult {
  milestones: Milestone[];
  endDate: Date;
}

// 依 groupOrder 分組，同組平行、全部完成才進下一組；遞迴處理巢狀子步驟。
function scheduleSteps(steps: TemplateStep[], start: Date): ScheduleResult {
  const groupOrders = [...new Set(steps.map((s) => s.groupOrder))].sort((a, b) => a - b);
  let cursor = new Date(start);
  const byId = new Map<string, Milestone>();

  for (const g of groupOrders) {
    const groupSteps = steps.filter((s) => s.groupOrder === g);
    let groupEnd = new Date(cursor);

    for (const step of groupSteps) {
      if (step.subSteps && step.subSteps.length > 0) {
        const sub = scheduleSteps(step.subSteps, cursor);
        byId.set(step.id, {
          id: step.id,
          name: step.name,
          groupOrder: step.groupOrder,
          subMilestones: sub.milestones
        });
        if (sub.endDate > groupEnd) groupEnd = sub.endDate;
      } else {
        const duration = step.durationDays ?? 0;
        const end = addWorkingDays(cursor, duration);
        byId.set(step.id, {
          id: step.id,
          name: step.name,
          groupOrder: step.groupOrder,
          plannedStartDate: toDateOnlyString(cursor),
          plannedDate: toDateOnlyString(end),
          status: '待辦',
          checklistItems: toChecklist(step.checklistItems)
        });
        if (end > groupEnd) groupEnd = end;
      }
    }
    cursor = groupEnd;
  }

  const milestones = steps.map((s) => byId.get(s.id)!);
  return { milestones, endDate: cursor };
}

// 套用範本：從專案啟動日開始，依範本步驟自動排出整組 Milestone 時程。
export function applyTemplateSteps(steps: TemplateStep[], startDate: string): Milestone[] {
  const { milestones } = scheduleSteps(steps, new Date(startDate));
  return milestones;
}
