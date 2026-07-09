import { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './views/Dashboard';
import Projects from './views/Projects';
import Tasks from './views/Tasks';
import Calendar from './views/Calendar';
import KnowledgeBase from './views/KnowledgeBase';
import Settings from './views/Settings';
import { useProjects } from './hooks/useProjects';
import { useTemplates } from './hooks/useTemplates';
import { usePrograms } from './hooks/usePrograms';
import { useTasks } from './hooks/useTasks';

export type ViewState = 'DASHBOARD' | 'PROJECTS' | 'TASKS' | 'CALENDAR' | 'KNOWLEDGE_BASE' | 'SETTINGS';

export default function App() {
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const projectsApi = useProjects();
  const templatesApi = useTemplates();
  const programsApi = usePrograms();
  const tasksApi = useTasks();

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar currentView={view} onNavigate={setView} />
      <main className="flex-1 p-8">
        {view === 'DASHBOARD' && <Dashboard tasksApi={tasksApi} projectsApi={projectsApi} />}
        {view === 'PROJECTS' && <Projects projectsApi={projectsApi} templatesApi={templatesApi} programsApi={programsApi} />}
        {view === 'TASKS' && <Tasks tasksApi={tasksApi} projectsApi={projectsApi} />}
        {view === 'CALENDAR' && <Calendar />}
        {view === 'KNOWLEDGE_BASE' && <KnowledgeBase />}
        {view === 'SETTINGS' && <Settings templatesApi={templatesApi} />}
      </main>
    </div>
  );
}
