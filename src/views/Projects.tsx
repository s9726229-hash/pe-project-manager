import { useEffect, useState } from 'react';
import type { useProjects } from '../hooks/useProjects';
import type { useTemplates } from '../hooks/useTemplates';
import type { usePrograms } from '../hooks/usePrograms';
import type { useCases } from '../hooks/useCases';
import type { useNotes } from '../hooks/useNotes';
import type { useDocuments } from '../hooks/useDocuments';
import ProjectList from '../components/projects/ProjectList';
import ProjectDetail from '../components/projects/ProjectDetail';
import NewProjectModal, { buildMilestonesForTemplate } from '../components/projects/NewProjectModal';

interface ProjectsProps {
  projectsApi: ReturnType<typeof useProjects>;
  templatesApi: ReturnType<typeof useTemplates>;
  programsApi: ReturnType<typeof usePrograms>;
  casesApi: ReturnType<typeof useCases>;
  notesApi: ReturnType<typeof useNotes>;
  documentsApi: ReturnType<typeof useDocuments>;
  focusProjectId?: string | null;
  onFocusConsumed?: () => void;
}

export default function Projects({
  projectsApi,
  templatesApi,
  programsApi,
  casesApi,
  notesApi,
  documentsApi,
  focusProjectId,
  onFocusConsumed
}: ProjectsProps) {
  const { projects, addProject, updateProject, updateMilestones } = projectsApi;
  const { categories, templates } = templatesApi;
  const { programs, addProgram } = programsApi;
  const { cases, addCase, updateCase, deleteCase } = casesApi;
  const { notes, saveNote } = notesApi;
  const { documents, addDocument, updateDocument, deleteDocument } = documentsApi;

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);

  // 從 Dashboard 點卡片跳進來時，直接打開對應專案的詳情頁。
  useEffect(() => {
    if (focusProjectId) {
      setSelectedProjectId(focusProjectId);
      onFocusConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusProjectId]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;

  function handleCreate(input: {
    name: string;
    productLine: string;
    grade: string;
    notes: string;
    startDate: string;
    owner: string;
    appliedTemplateId: string;
    programId?: string;
  }) {
    const milestones = buildMilestonesForTemplate(templates, input.appliedTemplateId, input.startDate);
    const id = addProject({ ...input, milestones });
    setShowNewProject(false);
    setSelectedProjectId(id);
  }

  if (selectedProject) {
    return (
      <ProjectDetail
        project={selectedProject}
        programs={programs}
        onAddProgram={addProgram}
        onBack={() => setSelectedProjectId(null)}
        onUpdateProject={updateProject}
        onUpdateMilestones={updateMilestones}
        cases={cases}
        templateCategories={categories}
        templates={templates}
        onAddCase={addCase}
        onUpdateCase={updateCase}
        onDeleteCase={deleteCase}
        notes={notes}
        onSaveNote={saveNote}
        documents={documents}
        onAddDocument={addDocument}
        onUpdateDocument={updateDocument}
        onDeleteDocument={deleteDocument}
      />
    );
  }

  return (
    <>
      <ProjectList projects={projects} programs={programs} onOpen={setSelectedProjectId} onNewProject={() => setShowNewProject(true)} />
      {showNewProject && (
        <NewProjectModal
          categories={categories}
          templates={templates}
          programs={programs}
          onAddProgram={addProgram}
          onCancel={() => setShowNewProject(false)}
          onCreate={handleCreate}
        />
      )}
    </>
  );
}
