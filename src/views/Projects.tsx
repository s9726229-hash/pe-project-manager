import { useState } from 'react';
import type { useProjects } from '../hooks/useProjects';
import type { useTemplates } from '../hooks/useTemplates';
import type { usePrograms } from '../hooks/usePrograms';
import ProjectList from '../components/projects/ProjectList';
import ProjectDetail from '../components/projects/ProjectDetail';
import NewProjectModal, { buildMilestonesForTemplate } from '../components/projects/NewProjectModal';

interface ProjectsProps {
  projectsApi: ReturnType<typeof useProjects>;
  templatesApi: ReturnType<typeof useTemplates>;
  programsApi: ReturnType<typeof usePrograms>;
}

export default function Projects({ projectsApi, templatesApi, programsApi }: ProjectsProps) {
  const { projects, addProject, updateMilestones } = projectsApi;
  const { categories, templates } = templatesApi;
  const { programs, addProgram } = programsApi;

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;

  function handleCreate(input: {
    code: string;
    name: string;
    productLine: string;
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
        onBack={() => setSelectedProjectId(null)}
        onUpdateMilestones={updateMilestones}
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
