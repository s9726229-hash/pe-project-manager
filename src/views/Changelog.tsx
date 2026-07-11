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
      '範本管理獨立頁面（master-detail 佈局）',
      '設定頁簡化為資料備份',
      '版本記錄獨立頁面',
      '專案排程 / 待辦採容器視覺（深色 header + divider row）',
    ]
  },
  {
    version: 'v0.9',
    date: '2026-07-11',
    items: [
      'StepEditor：groupOrder 改動自動重排並行',
      '群組折疊 ▼ 與並行括線 ⇉',
      '知識庫 master-detail 版面放大',
      '待辦備注欄（MessageSquare 圖示展開 textarea）',
      '子任務同步設定日期',
    ]
  },
  {
    version: 'v0.8',
    date: '2026-07-11',
    items: [
      '全局搜尋 ⌃K（專案 / 任務 / 案件 / 備注 / 知識庫）',
      'JSON 備份匯出 / 匯入還原',
      '標準 NPI 流程範本（42 項，6 階段：Kickoff / Design / EVT / DVT / PVT / MP）',
    ]
  },
  {
    version: 'v0.7',
    date: '2026-07',
    items: [
      'Dashboard 大/小專案卡片分組、進行中任務列表',
      '行事曆月視圖（含排程里程碑顯示）',
    ]
  },
  {
    version: 'v0.6',
    date: '2026-07',
    items: [
      '專案備忘事項（白板 textarea，單一整頁輸入）',
      '全域知識庫（分類 + 筆記 CRUD）',
    ]
  },
  {
    version: 'v0.5',
    date: '2026-07',
    items: [
      '案件管理（Issue / ECN / 替代料 CRUD）',
      '套用範本至專案、案件追蹤狀態',
    ]
  },
  {
    version: 'v0.4',
    date: '2026-07',
    items: [
      '待辦事項（跨專案、急件標記、順延記錄）',
      'Dashboard 待辦事項小工具',
    ]
  },
  {
    version: 'v0.3',
    date: '2026-07',
    items: [
      '專案核心：CRUD、工作日自動排程、里程碑管理',
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
      '初始架構（Vite + React 18 + TypeScript + Tailwind CSS）',
      'localStorage 資料層（pe-pm: key prefix）',
    ]
  },
];

export default function Changelog() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">版本記錄</h1>

      <div className="relative">
        {/* 垂直時間線 */}
        <div className="absolute left-[3.25rem] top-0 bottom-0 w-px bg-slate-800" />

        <div className="space-y-8">
          {CHANGELOG.map((entry, idx) => (
            <div key={entry.version} className="flex gap-6">
              {/* 版本號 + 時間軸節點 */}
              <div className="flex flex-col items-end w-10 shrink-0 pt-0.5">
                <span className="text-xs font-mono font-bold text-primary-400 whitespace-nowrap">
                  {entry.version}
                </span>
              </div>

              {/* 節點圓點 */}
              <div className="shrink-0 mt-1.5 relative z-10">
                <div className={`w-2.5 h-2.5 rounded-full border-2 ${idx === 0 ? 'bg-primary-500 border-primary-400' : 'bg-slate-900 border-slate-600'}`} />
              </div>

              {/* 內容卡片 */}
              <div className="flex-1 pb-2">
                <div className="text-xs text-slate-500 mb-2 font-mono">{entry.date}</div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 space-y-1.5">
                  {entry.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-slate-600 mt-0.5 shrink-0">·</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
