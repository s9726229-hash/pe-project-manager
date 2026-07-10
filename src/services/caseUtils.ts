import type { Case, CaseStep } from '../types';

// 跟 Milestone 的並行群組邏輯一樣：同 groupOrder 平行，全部完成才算進到下一組。
// Case 步驟是單層（不像 Milestone 有巢狀大類/小類），所以不需要遞迴。

export function isCaseDone(c: Case): boolean {
  return c.steps.length > 0 && c.steps.every((s) => s.status === '已完成');
}

export function computeCaseProgress(c: Case): number {
  if (c.steps.length === 0) return 0;
  const done = c.steps.filter((s) => s.status === '已完成').length;
  return Math.round((done / c.steps.length) * 100);
}

// 目前卡在哪一關：最小的、還沒全部完成的並行群組。
export function getCurrentGroupOrder(steps: CaseStep[]): number | undefined {
  const groupOrders = [...new Set(steps.map((s) => s.groupOrder))].sort((a, b) => a - b);
  for (const g of groupOrders) {
    const groupSteps = steps.filter((s) => s.groupOrder === g);
    if (!groupSteps.every((s) => s.status === '已完成')) return g;
  }
  return undefined; // 全部完成
}

export function getCurrentStepNames(c: Case): string[] {
  const currentGroup = getCurrentGroupOrder(c.steps);
  if (currentGroup === undefined) return [];
  return c.steps.filter((s) => s.groupOrder === currentGroup && s.status !== '已完成').map((s) => s.name);
}

export function nextGroupOrder(steps: CaseStep[]): number {
  return steps.length === 0 ? 1 : Math.max(...steps.map((s) => s.groupOrder)) + 1;
}
