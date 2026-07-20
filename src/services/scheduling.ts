import type { ChecklistItem, Milestone, TemplateStep } from '../types';
import { newId } from './storage';
import { updateMilestoneById } from './milestoneUtils';

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

function addCalendarDays(start: Date, days: number): Date {
  const date = new Date(start);
  date.setDate(date.getDate() + Math.max(0, days));
  return date;
}

// addWorkingDays 的反運算：兩個日期之間間隔幾個工作天（跳過週六日）。
export function businessDaysBetween(startStr: string, endStr: string): number {
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (end <= start) return 0;
  let count = 0;
  const d = new Date(start);
  while (d < end) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

function calendarDaysBetween(startStr: string, endStr: string): number {
  const start = new Date(startStr);
  const end = new Date(endStr);
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86_400_000));
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
        const end = addCalendarDays(cursor, duration);
        byId.set(step.id, {
          id: step.id,
          name: step.name,
          groupOrder: step.groupOrder,
          plannedStartDate: toDateOnlyString(cursor),
          plannedDate: toDateOnlyString(end),
          durationDays: duration,
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

interface MilestoneScheduleResult {
  milestones: Milestone[];
  endDate: Date;
}

// 跟 scheduleSteps 邏輯一樣，但輸入輸出都是 Milestone（不是 TemplateStep）——
// 用來在使用者手動調整某個項目的工期後，把後面所有項目的時間重新往下順推。
// 只重算日期，名稱/狀態/負責人/checklist 等其他欄位原封不動保留。
function rescheduleMilestoneList(milestones: Milestone[], start: Date): MilestoneScheduleResult {
  const groupOrders = [...new Set(milestones.map((m) => m.groupOrder))].sort((a, b) => a - b);
  let cursor = new Date(start);
  const byId = new Map<string, Milestone>();

  for (const g of groupOrders) {
    const groupMilestones = milestones.filter((m) => m.groupOrder === g);
    let groupEnd = new Date(cursor);

    for (const m of groupMilestones) {
      if (m.subMilestones && m.subMilestones.length > 0) {
        const sub = rescheduleMilestoneList(m.subMilestones, cursor);
        byId.set(m.id, { ...m, subMilestones: sub.milestones });
        if (sub.endDate > groupEnd) groupEnd = sub.endDate;
      } else {
        const duration = m.durationDays ?? 0;
        const end = addCalendarDays(cursor, duration);
        byId.set(m.id, {
          ...m,
          plannedStartDate: toDateOnlyString(cursor),
          plannedDate: toDateOnlyString(end)
        });
        if (end > groupEnd) groupEnd = end;
      }
    }
    cursor = groupEnd;
  }

  const result = milestones.map((m) => byId.get(m.id)!);
  return { milestones: result, endDate: cursor };
}

export function rescheduleFromStart(milestones: Milestone[], projectStartDate: string): Milestone[] {
  return rescheduleMilestoneList(milestones, new Date(projectStartDate)).milestones;
}

// 使用者手動改某個葉節點的結束時間：反推出新工期，存回那個節點，
// 然後從專案啟動日整條重新排程，讓後面所有項目跟著順延/提前。
export function rescheduleAfterEndDateEdit(
  milestones: Milestone[],
  leafId: string,
  newEndDate: string,
  projectStartDate: string
): Milestone[] {
  const updated = updateMilestoneById(milestones, leafId, (m) => {
    const duration = calendarDaysBetween(m.plannedStartDate ?? projectStartDate, newEndDate);
    return { ...m, plannedDate: newEndDate, durationDays: duration };
  });
  return rescheduleFromStart(updated, projectStartDate);
}

// 專案套完範本後，臨時新增的葉節點/群組——預設工期 1 天，實際日期由後續 reschedule 算出來。
export function makeNewLeafMilestone(name: string, groupOrder: number): Milestone {
  return { id: newId(), name, groupOrder, durationDays: 1, status: '待辦' };
}

export function makeNewGroupMilestone(name: string, groupOrder: number): Milestone {
  return { id: newId(), name, groupOrder, subMilestones: [makeNewLeafMilestone('新子項目', 1)] };
}
