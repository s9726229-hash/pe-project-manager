import { useEffect, useState } from 'react';
import type { Milestone, Project, ProjectStatus } from '../types';
import { loadFromStorage, newId, saveToStorage, STORAGE_KEYS } from '../services/storage';

export interface NewProjectInput {
  code: string;
  name: string;
  productLine: string;
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

  function addProject(input: NewProjectInput) {
    const project: Project = {
      id: newId(),
      code: input.code,
      name: input.name,
      productLine: input.productLine,
      startDate: input.startDate,
      appliedTemplateId: input.appliedTemplateId,
      status: '進行中',
      owner: input.owner,
      notes: '',
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

  function updateMilestones(id: string, milestones: Milestone[]) {
    updateProject(id, { milestones });
  }

  function deleteProject(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  return { projects, addProject, updateProject, setStatus, updateMilestones, deleteProject };
}
