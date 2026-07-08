import { useState } from 'react';
import type { useProjects } from '../hooks/useProjects';
import type { useTemplates } from '../hooks/useTemplates';
import ProjectList from '../components/projects/ProjectList';
import ProjectDetail from '../components/projects/ProjectDetail';
import NewProjectModal, { buildMilestonesForTemplate } from '../components/projects/NewProjectModal';

interface ProjectsProps {
  projectsApi: ReturnType<typeof useProjects>;
  templatesApi: ReturnType<typeof useTemplates>;
}

export default function Projects({ projectsApi, templatesApi }: ProjectsProps) {
  const { projects, addProject, updateMilestones } = projectsApi;
  const { categories, templates } = templatesApi;

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;

  function handleCreate(input: { code: string; name: string; productLine: string; startDate: string; owner: string; appliedTemplateId: string }) {
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
      <ProjectList projects={projects} onOpen={setSelectedProjectId} onNewProject={() => setShowNewProject(true)} />
      {showNewProject && (
        <NewProjectModal
          categories={categories}
          templates={templates}
          onCancel={() => setShowNewProject(false)}
          onCreate={handleCreate}
        />
      )}
    </>
  );
}
