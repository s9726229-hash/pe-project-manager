import { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './views/Dashboard';
import Projects from './views/Projects';
import Tasks from './views/Tasks';
import Calendar from './views/Calendar';
import KnowledgeBase from './views/KnowledgeBase';
import Settings from './views/Settings';

export type ViewState = 'DASHBOARD' | 'PROJECTS' | 'TASKS' | 'CALENDAR' | 'KNOWLEDGE_BASE' | 'SETTINGS';

const VIEW_COMPONENTS: Record<ViewState, React.ComponentType> = {
  DASHBOARD: Dashboard,
  PROJECTS: Projects,
  TASKS: Tasks,
  CALENDAR: Calendar,
  KNOWLEDGE_BASE: KnowledgeBase,
  SETTINGS: Settings
};

export default function App() {
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const ActiveView = VIEW_COMPONENTS[view];

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar currentView={view} onNavigate={setView} />
      <main className="flex-1 p-8">
        <ActiveView />
      </main>
    </div>
  );
}
