import type { Case, KnowledgeCategory, KnowledgeNote, Note, Program, Project, Task } from '../types';

export type SearchResultKind = 'project' | 'task' | 'case' | 'note' | 'knowledge';

export interface SearchResult {
  kind: SearchResultKind;
  id: string;
  title: string;
  subtitle: string;
  projectId?: string;
}

function hit(query: string, ...fields: (string | undefined | null)[]): boolean {
  const q = query.toLowerCase();
  return fields.some((f) => f?.toLowerCase().includes(q));
}

function flattenTasks(tasks: Task[]): Task[] {
  const out: Task[] = [];
  function walk(t: Task) { out.push(t); t.subTasks?.forEach(walk); }
  tasks.forEach(walk);
  return out;
}

export function globalSearch(
  query: string,
  data: {
    projects: Project[];
    programs: Program[];
    tasks: Task[];
    cases: Case[];
    notes: Note[];
    knowledgeNotes: KnowledgeNote[];
    knowledgeCategories: KnowledgeCategory[];
  }
): SearchResult[] {
  const q = query.trim();
  if (!q) return [];
  const results: SearchResult[] = [];

  // 專案
  for (const p of data.projects) {
    if (hit(q, p.name, p.productLine, p.grade, p.owner, p.notes)) {
      const program = data.programs.find((pg) => pg.id === p.programId);
      results.push({
        kind: 'project',
        id: p.id,
        title: p.name,
        subtitle: program ? `大專案：${program.name}` : (p.productLine || '獨立專案'),
      });
    }
  }

  // 待辦（含子任務）
  for (const t of flattenTasks(data.tasks)) {
    if (hit(q, t.title)) {
      const project = data.projects.find((p) => p.id === t.projectId);
      results.push({
        kind: 'task',
        id: t.id,
        title: t.title,
        subtitle: project?.name ?? '日常行政/雜項',
      });
    }
  }

  // 案件（含步驟名）
  for (const c of data.cases) {
    if (hit(q, c.name, c.partNumber, c.notes, c.caseTypeLabel, ...c.steps.map((s) => s.name))) {
      const project = data.projects.find((p) => p.id === c.projectId);
      results.push({
        kind: 'case',
        id: c.id,
        title: c.name,
        subtitle: `${c.caseTypeLabel} · ${project?.name ?? ''}`,
        projectId: c.projectId,
      });
    }
  }

  // 備忘事項
  for (const n of data.notes) {
    if (hit(q, n.content)) {
      const project = data.projects.find((p) => p.id === n.projectId);
      results.push({
        kind: 'note',
        id: n.id,
        title: n.content.slice(0, 60) + (n.content.length > 60 ? '…' : ''),
        subtitle: `備忘事項 · ${project?.name ?? ''}`,
        projectId: n.projectId,
      });
    }
  }

  // 知識庫
  for (const kn of data.knowledgeNotes) {
    if (hit(q, kn.title, kn.content)) {
      const cat = data.knowledgeCategories.find((c) => c.id === kn.categoryId);
      results.push({
        kind: 'knowledge',
        id: kn.id,
        title: kn.title || kn.content.slice(0, 60),
        subtitle: `知識庫 · ${cat?.name ?? ''}`,
      });
    }
  }

  return results;
}
