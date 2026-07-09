import type { Milestone } from '../types';

// 大類（有 subMilestones 的節點）不記錄自己的日期/狀態，一律由子項目推算——
// 這裡集中處理這些「推算」邏輯，其他地方（列表頁、Dashboard、排程進度頁）都共用。

export function isGroupMilestone(m: Milestone): boolean {
  return !!m.subMilestones && m.subMilestones.length > 0;
}

export function flattenLeaves(milestones: Milestone[]): Milestone[] {
  const leaves: Milestone[] = [];
  for (const m of milestones) {
    if (isGroupMilestone(m)) leaves.push(...flattenLeaves(m.subMilestones!));
    else leaves.push(m);
  }
  return leaves;
}

export function isMilestoneDone(m: Milestone): boolean {
  if (isGroupMilestone(m)) return m.subMilestones!.every(isMilestoneDone);
  return m.status === '已完成';
}

// 遞迴找出某節點涵蓋的日期範圍（大類沒有自己的日期，從子項目算）。
export function getMilestoneDateRange(m: Milestone): { start?: string; end?: string } {
  if (!isGroupMilestone(m)) {
    return { start: m.plannedStartDate, end: m.plannedDate };
  }
  const ranges = m.subMilestones!.map(getMilestoneDateRange);
  const starts = ranges.map((r) => r.start).filter((d): d is string => !!d);
  const ends = ranges.map((r) => r.end).filter((d): d is string => !!d);
  return {
    start: starts.length ? starts.reduce((a, b) => (a < b ? a : b)) : undefined,
    end: ends.length ? ends.reduce((a, b) => (a > b ? a : b)) : undefined
  };
}

export function computeProgressPercent(milestones: Milestone[]): number {
  const leaves = flattenLeaves(milestones);
  if (leaves.length === 0) return 0;
  const done = leaves.filter((l) => l.status === '已完成').length;
  return Math.round((done / leaves.length) * 100);
}

// 「目前階段」：第一個還沒全部完成的頂層項目（大類或葉節點）。
export function getCurrentStage(milestones: Milestone[]): Milestone | undefined {
  return milestones.find((m) => !isMilestoneDone(m)) ?? milestones[milestones.length - 1];
}

export type TodayRelativeStatus = 'done' | 'overdue' | 'current' | 'upcoming';

// 只對葉節點有意義：手動狀態優先（選了進行中/已完成就直接反映，不再被日期蓋過去），
// 只有還在「待辦」時才用日期推算逾期/進行中/未開始。
export function getTodayRelativeStatus(m: Milestone, today: Date = new Date()): TodayRelativeStatus {
  if (m.status === '已完成') return 'done';
  if (m.status === '進行中') return 'current';
  const todayStr = today.toISOString().slice(0, 10);
  if (m.plannedDate && todayStr > m.plannedDate) return 'overdue';
  if (m.plannedStartDate && todayStr >= m.plannedStartDate) return 'current';
  return 'upcoming';
}

// 大類/葉節點都適用：大類沒有自己的日期，改用推算出來的日期範圍判斷。
export function getMilestoneTodayStatus(m: Milestone, today: Date = new Date()): TodayRelativeStatus {
  if (isMilestoneDone(m)) return 'done';
  if (!isGroupMilestone(m)) return getTodayRelativeStatus(m, today);
  const { start, end } = getMilestoneDateRange(m);
  const todayStr = today.toISOString().slice(0, 10);
  if (end && todayStr > end) return 'overdue';
  if (start && todayStr >= start) return 'current';
  return 'upcoming';
}

export function getNextMilestoneDate(milestones: Milestone[]): string | undefined {
  const leaves = flattenLeaves(milestones).filter((l) => l.status !== '已完成' && l.plannedDate);
  if (leaves.length === 0) return undefined;
  return leaves.map((l) => l.plannedDate!).reduce((a, b) => (a < b ? a : b));
}

// 遞迴找到指定 id 的節點（大類或葉節點皆可），用 updater 算出新版本後換掉，其餘結構不變。
export function updateMilestoneById(milestones: Milestone[], id: string, updater: (m: Milestone) => Milestone): Milestone[] {
  return milestones.map((m) => {
    if (m.id === id) return updater(m);
    if (m.subMilestones) return { ...m, subMilestones: updateMilestoneById(m.subMilestones, id, updater) };
    return m;
  });
}

export function isProjectFullyDone(milestones: Milestone[]): boolean {
  return milestones.length > 0 && milestones.every(isMilestoneDone);
}
