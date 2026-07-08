import { LayoutDashboard, FolderKanban, CheckSquare, CalendarDays, BookOpen, Settings as SettingsIcon } from 'lucide-react';
import type { ViewState } from '../../App';

interface NavItem {
  view: ViewState;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { view: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'PROJECTS', label: '專案', icon: FolderKanban },
  { view: 'TASKS', label: '待辦事項', icon: CheckSquare },
  { view: 'CALENDAR', label: '行事曆', icon: CalendarDays },
  { view: 'KNOWLEDGE_BASE', label: '知識庫', icon: BookOpen },
  { view: 'SETTINGS', label: '設定', icon: SettingsIcon }
];

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
}

export default function Sidebar({ currentView, onNavigate }: SidebarProps) {
  return (
    <aside className="w-56 shrink-0 bg-slate-900 border-r border-slate-800 min-h-screen p-4">
      <div className="text-lg font-bold mb-6 px-2">PE Project Manager</div>
      <nav className="space-y-1">
        {NAV_ITEMS.map(({ view, label, icon: Icon }) => {
          const active = currentView === view;
          return (
            <button
              key={view}
              onClick={() => onNavigate(view)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active ? 'bg-primary-600/20 text-primary-400' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
