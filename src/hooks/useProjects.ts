import { useEffect, useState } from 'react';
import type { Milestone, Project, ProjectStatus } from '../types';
import { loadFromStorage, newId, saveToStorage, STORAGE_KEYS } from '../services/storage';
import { isProjectFullyDone } from '../services/milestoneUtils';

// 固定 id 的虛擬專案，讓沒有對應真實 NPI 專案的雜項待辦事項有地方掛。
// 不算「真的」專案，Project 列表頁會把它濾掉，但 Task 建立時的專案選單看得到。
export const DEFAULT_PROJECT_ID = 'default-misc-project';

function buildDefaultProject(): Project {
  return {
    id: DEFAULT_PROJECT_ID,
    name: '日常行政/雜項',
    productLine: '',
    grade: '',
    startDate: new Date().toISOString().slice(0, 10),
    appliedTemplateId: '',
    status: '進行中',
    owner: '',
    notes: '',
    milestones: []
  };
}

export interface NewProjectInput {
  name: string;
  productLine: string;
  grade: string;
  notes?: string;
  startDate: string;
  appliedTemplateId: string;
  owner: string;
  milestones: Milestone[];
  programId?: string;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(() => loadFromStorage(STORAGE_KEYS.projects, [] as Project[]));

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.projects, projects);
  }, [projects]);

  // 確保虛擬的「日常行政/雜項」專案一定存在，不管其他真實專案有沒有建過。
  useEffect(() => {
    setProjects((prev) => (prev.some((p) => p.id === DEFAULT_PROJECT_ID) ? prev : [buildDefaultProject(), ...prev]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addProject(input: NewProjectInput) {
    const project: Project = {
      id: newId(),
      name: input.name,
      productLine: input.productLine,
      grade: input.grade,
      startDate: input.startDate,
      appliedTemplateId: input.appliedTemplateId,
      status: '進行中',
      owner: input.owner,
      notes: input.notes ?? '',
      milestones: input.milestones,
      programId: input.programId
    };
    setProjects((prev) => [...prev, project]);
    return project.id;
  }

  function updateProject(id: string, patch: Partial<Project>) {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function setStatus(id: string, status: ProjectStatus) {
    updateProject(id, { status });
  }

  // 專案底下的里程碑全部完成時，自動把專案狀態同步成「已完成」；
  // 如果又有項目變回未完成，且目前狀態是「已完成」（代表是被這裡自動設的），改回「進行中」。
  // 「暫停」「取消」是使用者自己的手動判斷，不去動它。
  function updateMilestones(id: string, milestones: Milestone[]) {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const allDone = isProjectFullyDone(milestones);
        let status = p.status;
        if (p.status === '進行中' && allDone) status = '已完成';
        else if (p.status === '已完成' && !allDone) status = '進行中';
        return { ...p, milestones, status };
      })
    );
  }

  function deleteProject(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  return { projects, addProject, updateProject, setStatus, updateMilestones, deleteProject };
}
