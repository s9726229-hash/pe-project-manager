import { BookOpen, CalendarDays, CheckSquare, ClockIcon, FileStack, FolderKanban, LayoutDashboard, Search, Settings as SettingsIcon } from 'lucide-react';
import type { ViewState } from '../../App';

interface NavItem {
  view: ViewState;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { view: 'DASHBOARD',        label: 'Dashboard', icon: LayoutDashboard },
  { view: 'PROJECTS',         label: '專案',       icon: FolderKanban },
  { view: 'TASKS',            label: '待辦事項',    icon: CheckSquare },
  { view: 'CALENDAR',         label: '行事曆',      icon: CalendarDays },
  { view: 'KNOWLEDGE_BASE',   label: '知識庫',      icon: BookOpen },
  { view: 'TEMPLATE_MANAGER', label: '範本管理',    icon: FileStack },
  { view: 'SETTINGS',         label: '設定',        icon: SettingsIcon },
];

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onOpenSearch: () => void;
}

export default function Sidebar({ currentView, onNavigate, onOpenSearch }: SidebarProps) {
  return (
    <aside className="w-56 shrink-0 bg-slate-900 border-r border-slate-800 min-h-screen flex flex-col p-4">
      <div className="text-lg font-bold mb-4 px-2">PE Project Manager</div>

      {/* 搜尋 */}
      <button
        onClick={onOpenSearch}
        className="w-full flex items-center gap-2 px-3 py-1.5 mb-4 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 text-sm transition-colors"
      >
        <Search size={14} />
        <span className="flex-1 text-left">搜尋...</span>
        <kbd className="text-xs bg-slate-700 px-1.5 py-0.5 rounded text-slate-500">⌃K</kbd>
      </button>

      <nav className="space-y-1 flex-1">
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

      {/* 版本記錄 — 固定在底部 */}
      <div className="mt-4 border-t border-slate-800 pt-3">
        <button
          onClick={() => onNavigate('CHANGELOG')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            currentView === 'CHANGELOG' ? 'bg-primary-600/20 text-primary-400' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
          }`}
        >
          <ClockIcon size={16} />
          <span className="flex-1 text-left">版本記錄</span>
          <span className="text-xs font-mono text-slate-600">v1.0</span>
        </button>
      </div>
    </aside>
  );
}
