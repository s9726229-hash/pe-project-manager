import { useEffect, useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import SearchModal from './components/search/SearchModal';
import Dashboard from './views/Dashboard';
import Projects from './views/Projects';
import Tasks from './views/Tasks';
import Calendar from './views/Calendar';
import KnowledgeBase from './views/KnowledgeBase';
import Settings from './views/Settings';
import TemplateManager from './views/TemplateManager';
import Changelog from './views/Changelog';
import { useProjects } from './hooks/useProjects';
import { useTemplates } from './hooks/useTemplates';
import { usePrograms } from './hooks/usePrograms';
import { useTasks } from './hooks/useTasks';
import { useCases } from './hooks/useCases';
import { useNotes } from './hooks/useNotes';
import { useDocuments } from './hooks/useDocuments';
import { useKnowledge } from './hooks/useKnowledge';
import { initAutoBackup } from './services/autoBackup';

export type ViewState = 'DASHBOARD' | 'PROJECTS' | 'TASKS' | 'CALENDAR' | 'KNOWLEDGE_BASE' | 'TEMPLATE_MANAGER' | 'CHANGELOG' | 'SETTINGS';

export default function App() {
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [focusProjectId, setFocusProjectId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const projectsApi = useProjects();
  const templatesApi = useTemplates();
  const programsApi = usePrograms();
  const tasksApi = useTasks();
  const casesApi = useCases();
  const notesApi = useNotes();
  const documentsApi = useDocuments();
  const knowledgeApi = useKnowledge();

  function openProject(projectId: string) {
    setFocusProjectId(projectId);
    setView('PROJECTS');
  }

  // 自動備份：每日快照 + 備份資料夾監聽
  useEffect(() => { initAutoBackup(); }, []);

  // Ctrl+K / Cmd+K 開啟搜尋
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar currentView={view} onNavigate={setView} onOpenSearch={() => setSearchOpen(true)} />
      <main className="flex-1 p-8">
        {view === 'DASHBOARD' && (
          <Dashboard
            tasksApi={tasksApi}
            projectsApi={projectsApi}
            casesApi={casesApi}
            programsApi={programsApi}
            onOpenProject={openProject}
          />
        )}
        {view === 'PROJECTS' && (
          <Projects
            projectsApi={projectsApi}
            tasksApi={tasksApi}
            templatesApi={templatesApi}
            programsApi={programsApi}
            casesApi={casesApi}
            notesApi={notesApi}
            documentsApi={documentsApi}
            focusProjectId={focusProjectId}
            onFocusConsumed={() => setFocusProjectId(null)}
          />
        )}
        {view === 'TASKS' && <Tasks tasksApi={tasksApi} projectsApi={projectsApi} />}
        {view === 'CALENDAR' && <Calendar tasksApi={tasksApi} projectsApi={projectsApi} onNavigate={setView} onOpenProject={openProject} />}
        {view === 'KNOWLEDGE_BASE' && <KnowledgeBase knowledgeApi={knowledgeApi} />}
        {view === 'TEMPLATE_MANAGER' && <TemplateManager templatesApi={templatesApi} />}
        {view === 'CHANGELOG' && <Changelog />}
        {view === 'SETTINGS' && <Settings />}
      </main>

      {searchOpen && (
        <SearchModal
          projects={projectsApi.projects}
          programs={programsApi.programs}
          tasks={tasksApi.tasks}
          cases={casesApi.cases}
          notes={notesApi.notes}
          knowledgeNotes={knowledgeApi.notes}
          knowledgeCategories={knowledgeApi.categories}
          onClose={() => setSearchOpen(false)}
          onNavigate={setView}
          onOpenProject={openProject}
        />
      )}
    </div>
  );
}
