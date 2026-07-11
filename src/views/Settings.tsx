import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { exportBackup, importBackup } from '../services/backup';
import { STORAGE_KEYS } from '../services/storage';

function getCount(key: string): number {
  try { return (JSON.parse(localStorage.getItem('pe-pm:' + key) ?? '[]') as unknown[]).length; } catch { return 0; }
}

export default function Settings() {
  const [importStatus, setImportStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = [
    { label: '專案', value: Math.max(0, getCount(STORAGE_KEYS.projects) - 1) },
    { label: '待辦事項', value: getCount(STORAGE_KEYS.tasks) },
    { label: '案件', value: getCount(STORAGE_KEYS.cases) },
    { label: '知識庫筆記', value: getCount(STORAGE_KEYS.knowledgeNotes) },
  ];

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importBackup(file);
      setImportStatus('ok');
      setTimeout(() => window.location.reload(), 800);
    } catch {
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 3000);
    }
    e.target.value = '';
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">設定</h1>
      <p className="text-slate-400 mb-6 text-sm">應用程式設定與資料管理。</p>

      {/* 關於 */}
      <section className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl max-w-lg mb-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">關於</h2>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-slate-200 font-medium">PE Project Manager</span>
          <span className="text-xs text-slate-500 font-mono">v1.0</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="text-center bg-slate-800/60 rounded-lg py-2 px-1">
              <div className="text-xl font-semibold text-slate-100">{s.value}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 資料備份 */}
      <section className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl max-w-lg">
        <h2 className="text-sm font-semibold text-slate-300 mb-1">資料備份</h2>
        <p className="text-xs text-slate-500 mb-4">
          所有資料存在瀏覽器本機。定期匯出備份，避免因清除快取而遺失。
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={exportBackup}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600/20 border border-primary-600/40 text-primary-400 rounded-lg text-sm hover:bg-primary-600/30 transition-colors"
          >
            <Download size={15} />
            匯出備份 JSON
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition-colors"
          >
            <Upload size={15} />
            匯入還原
          </button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          {importStatus === 'ok' && <span className="text-xs text-emerald-400">匯入成功，重新載入中...</span>}
          {importStatus === 'error' && <span className="text-xs text-red-400">檔案格式錯誤，請確認是正確的備份檔。</span>}
        </div>
      </section>
    </div>
  );
}
