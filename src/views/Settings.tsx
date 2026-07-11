import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { exportBackup, importBackup } from '../services/backup';

export default function Settings() {
  const [importStatus, setImportStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
