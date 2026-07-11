import { useState } from 'react';
import { BookOpen, CalendarDays, CheckSquare, ChevronDown, ChevronRight, FileStack, FolderKanban, LayoutDashboard, Search, Settings as SettingsIcon } from 'lucide-react';
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
  { view: 'SETTINGS',         label: '設定',        icon: SettingsIcon }
];

interface ChangelogEntry {
  version: string;
  date: string;
  items: string[];
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: 'v1.0',
    date: '2026-07-11',
    items: [
      '範本管理獨立頁面 (master-detail)',
      '設定頁簡化為資料備份',
      '專案排程 / 待辦採容器視覺（深色 header + divider row）',
    ]
  },
  {
    version: 'v0.9',
    date: '2026-07-11',
    items: [
      'StepEditor：groupOrder 改動自動重排並行',
      '群組折疊 ▼ 與並行括線 ⇉',
      '知識庫 master-detail 版面',
      '待辦備注欄、子任務同步設定日期',
    ]
  },
  {
    version: 'v0.8',
    date: '2026-07-11',
    items: [
      '全局搜尋 ⌃K（專案/任務/案件/備注/知識庫）',
      'JSON 備份匯出 / 匯入還原',
      '標準NPI流程範本（42項，6階段）',
    ]
  },
  {
    version: 'v0.7',
    date: '2026-07',
    items: [
      'Dashboard 大/小專案卡片、進行中任務',
      '行事曆月視圖（含排程里程碑）',
    ]
  },
  {
    version: 'v0.6',
    date: '2026-07',
    items: [
      '專案備忘事項（白板 textarea）',
      '全域知識庫（分類 + 筆記）',
    ]
  },
  {
    version: 'v0.5',
    date: '2026-07',
    items: [
      '案件管理（Issue / ECN / 替代料）',
      '套範本、步驟 CRUD、案件追蹤',
    ]
  },
  {
    version: 'v0.4',
    date: '2026-07',
    items: [
      '待辦事項（跨專案、急件、順延記錄）',
      'Dashboard 待辦小工具',
    ]
  },
  {
    version: 'v0.3',
    date: '2026-07',
    items: [
      '專案核心：CRUD、工作日排程、里程碑',
      '大專案（Program）分組',
    ]
  },
  {
    version: 'v0.2',
    date: '2026-07',
    items: [
      '範本系統：分類、步驟、子步驟、checklist',
      'ECN / 替代料預設範本',
    ]
  },
  {
    version: 'v0.1',
    date: '2026-07',
    items: [
      '初始架構（Vite + React + TypeScript + Tailwind）',
      'localStorage 資料層',
    ]
  },
];

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onOpenSearch: () => void;
}

export default function Sidebar({ currentView, onNavigate, onOpenSearch }: SidebarProps) {
  const [changelogOpen, setChangelogOpen] = useState(false);

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

      {/* 版本記錄 */}
      <div className="mt-4 border-t border-slate-800 pt-3">
        <button
          onClick={() => setChangelogOpen((v) => !v)}
          className="w-full flex items-center justify-between px-2 py-1 text-xs text-slate-500 hover:text-slate-300 transition-colors rounded"
        >
          <span className="font-mono">v1.0</span>
          <span className="flex items-center gap-1">
            版本記錄
            {changelogOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </span>
        </button>

        {changelogOpen && (
          <div className="mt-2 max-h-72 overflow-y-auto space-y-3 pr-1">
            {CHANGELOG.map((entry) => (
              <div key={entry.version}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-semibold text-primary-400">{entry.version}</span>
                  <span className="text-xs text-slate-600">{entry.date}</span>
                </div>
                <ul className="space-y-0.5">
                  {entry.items.map((item, i) => (
                    <li key={i} className="text-xs text-slate-500 pl-2 leading-relaxed before:content-['·'] before:mr-1 before:text-slate-600">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
