// 資料模型定義，對應 REQUIREMENTS.md 的規格。
// 階段 0 先建立型別骨架，實際的 CRUD／儲存邏輯留到階段 1（範本系統）之後陸續實作。

export type ProjectStatus = '進行中' | '暫停' | '取消' | '已完成';

// 大專案：純粹分組用的輕量實體，不套範本、不記錄自己的日期。
// 小專案（Project）可以選填掛在某個 Program 底下，也可以完全不掛（單獨專案）。
// 用名稱識別就夠用，不需要另外的代號欄位。
export interface Program {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  productLine: string;
  grade: string; // 產品等級，例如商規/工規/DC，自由文字不限定選項
  startDate: string;
  appliedTemplateId: string;
  status: ProjectStatus;
  owner: string;
  notes: string;
  milestones: Milestone[];
  programId?: string;
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
  // 手動改結束時間時，會反推存成這個葉節點的工期，讓整條時程可以重新往下順推。
  durationDays?: number;
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

// 文件連結或正式會議記錄，掛在專案下——跟 Note（隨手筆記）分開，這邊是比較正式的紀錄。
export interface ProjectDocument {
  id: string;
  projectId: string;
  type: '文件連結' | '會議記錄';
  title: string;
  date: string;
  content?: string;
}

export type CaseStepStatus = '待辦' | '進行中' | '已完成';

// Case 套範本後拿到自己獨立的一份步驟拷貝（不是回頭參照 Template），
// 套用完仍可自由新增/刪除步驟，範本之後被改掉也不會影響已經開的案件。
export interface CaseStep {
  id: string;
  name: string;
  groupOrder: number;
  status: CaseStepStatus;
  completedDate?: string;
  owner?: string;
  note?: string;
}

export interface Case {
  id: string;
  projectId: string;
  name: string;
  caseTypeLabel: string; // 套用當下的範本名稱，純顯示用（例如「ECN」「替代料」）
  openDate: string;
  partNumber?: string;
  notes?: string;
  steps: CaseStep[];
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
