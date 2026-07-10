import { useEffect, useState } from 'react';
import type { Case, CaseStep, Template } from '../types';
import { loadFromStorage, newId, saveToStorage, STORAGE_KEYS } from '../services/storage';

export interface NewCaseInput {
  projectId: string;
  name: string;
  openDate: string;
  partNumber?: string;
  notes?: string;
  template: Template;
}

function buildStepsFromTemplate(template: Template): CaseStep[] {
  // Case 步驟不支援巢狀（範本裡如果有 subSteps 就攤平，Case 這邊只需要單層並行分組）。
  const flat = template.steps.flatMap((s) => (s.subSteps && s.subSteps.length > 0 ? s.subSteps : [s]));
  return flat.map((s) => ({ id: newId(), name: s.name, groupOrder: s.groupOrder, status: '待辦' as const }));
}

export function useCases() {
  const [cases, setCases] = useState<Case[]>(() => loadFromStorage(STORAGE_KEYS.cases, [] as Case[]));

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.cases, cases);
  }, [cases]);

  function addCase(input: NewCaseInput) {
    const newCase: Case = {
      id: newId(),
      projectId: input.projectId,
      name: input.name,
      caseTypeLabel: input.template.name,
      openDate: input.openDate,
      partNumber: input.partNumber,
      notes: input.notes,
      steps: buildStepsFromTemplate(input.template)
    };
    setCases((prev) => [...prev, newCase]);
    return newCase.id;
  }

  function updateCase(id: string, patch: Partial<Case>) {
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function updateSteps(id: string, steps: CaseStep[]) {
    updateCase(id, { steps });
  }

  function deleteCase(id: string) {
    setCases((prev) => prev.filter((c) => c.id !== id));
  }

  return { cases, addCase, updateCase, updateSteps, deleteCase };
}
