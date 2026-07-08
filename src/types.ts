// 資料模型定義，對應 REQUIREMENTS.md 的規格。
// 階段 0 先建立型別骨架，實際的 CRUD／儲存邏輯留到階段 1（範本系統）之後陸續實作。

export type ProjectStatus = '進行中' | '暫停' | '取消' | '已完成';

export interface Project {
  id: string;
  code: string;
  name: string;
  productLine: string;
  startDate: string;
  appliedTemplateId: string;
  status: ProjectStatus;
  owner: string;
  notes: string;
  milestones: Milestone[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface Milestone {
  id: string;
  name: string;
  groupOrder: number;
  // plannedStartDate/plannedDate 只有葉節點（沒有 subMilestones）才有意義，
  // 由工作日排程演算法計算出來；plannedDate 是這個項目的目標完成日。
  plannedStartDate?: string;
  plannedDate?: string;
  actualDate?: string;
  owner?: string;
  status?: '待辦' | '進行中' | '已完成';
  checklistItems?: ChecklistItem[];
  subMilestones?: Milestone[];
}

export type TaskStatus = '待辦' | '進行中' | '已完成';

export interface TaskRecurring {
  frequency: 'daily' | 'weekly' | 'monthly';
  weekday?: number; // 0-6，weekly 用
  dayOfMonth?: number; // monthly 用
}

export interface TaskPostponeEntry {
  oldDate: string;
  newDate: string;
  reason?: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  dueDate?: string;
  status?: TaskStatus;
  urgent?: boolean;
  recurring?: TaskRecurring;
  postponeHistory?: TaskPostponeEntry[];
  completedAt?: string;
  subTasks?: Task[];
}

export interface Note {
  id: string;
  projectId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export type CaseStepStatus = 'pending' | 'in-progress' | 'done';

export interface CaseStepStatusEntry {
  stepId: string;
  status: CaseStepStatus;
  completedDate?: string;
  owner?: string;
  note?: string;
}

export interface Case {
  id: string;
  projectId: string;
  templateId: string;
  name: string;
  stepStatuses: CaseStepStatusEntry[];
}

export interface TemplateCategory {
  id: string;
  name: string;
}

export interface TemplateStep {
  id: string;
  name: string;
  groupOrder: number;
  durationDays?: number;
  checklistItems?: string[];
  subSteps?: TemplateStep[];
}

export interface Template {
  id: string;
  categoryId: string;
  name: string;
  isDefault?: boolean;
  steps: TemplateStep[];
}

export interface KnowledgeCategory {
  id: string;
  name: string;
}

export interface KnowledgeNote {
  id: string;
  categoryId: string;
  title?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
