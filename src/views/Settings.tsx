import { useEffect, useRef, useState } from 'react';
import { Download, FolderCheck, FolderOpen, History, Upload } from 'lucide-react';
import { exportBackup, importBackup } from '../services/backup';
import { STORAGE_KEYS } from '../services/storage';
import {
  chooseBackupFolder,
  disableFolderBackup,
  getFolderBackupStatus,
  getSnapshots,
  isFolderBackupSupported,
  reauthorizeFolder,
  restoreSnapshot,
  writeFolderBackup,
  type FolderBackupStatus,
  type SnapshotInfo,
} from '../services/autoBackup';

function getCount(key: string): number {
  try { return (JSON.parse(localStorage.getItem('pe-pm:' + key) ?? '[]') as unknown[]).length; } catch { return 0; }
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function Settings() {
  const [importStatus, setImportStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [folderStatus, setFolderStatus] = useState<FolderBackupStatus | null>(null);
  const [backupMessage, setBackupMessage] = useState('');
  const [snapshots, setSnapshots] = useState<SnapshotInfo[]>([]);
  const [confirmRestoreDate, setConfirmRestoreDate] = useState<string | null>(null);

  async function refreshFolderStatus() {
    setFolderStatus(await getFolderBackupStatus());
  }

  useEffect(() => {
    void refreshFolderStatus();
    setSnapshots(getSnapshots());
  }, []);

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

  async function handleChooseFolder() {
    const name = await chooseBackupFolder();
    if (name) setBackupMessage(`已設定備份資料夾「${name}」，並完成第一次備份。`);
    await refreshFolderStatus();
  }

  async function handleBackupNow() {
    const ok = await writeFolderBackup();
    setBackupMessage(ok ? '備份完成。' : '備份失敗，請確認資料夾授權。');
    await refreshFolderStatus();
  }

  async function handleReauthorize() {
    const ok = await reauthorizeFolder();
    setBackupMessage(ok ? '已重新授權並完成備份。' : '授權未完成。');
    await refreshFolderStatus();
  }

  async function handleDisable() {
    await disableFolderBackup();
    setBackupMessage('已停用自動備份。');
    await refreshFolderStatus();
  }

  function handleRestore(date: string) {
    if (confirmRestoreDate !== date) {
      setConfirmRestoreDate(date);
      return;
    }
    if (restoreSnapshot(date)) {
      window.location.reload();
    } else {
      setBackupMessage('還原失敗。');
      setConfirmRestoreDate(null);
    }
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

      {/* 自動備份 */}
      <section className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl max-w-lg mb-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-1">自動備份</h2>
        {!isFolderBackupSupported() && (
          <p className="text-xs text-slate-500">此瀏覽器不支援自動備份資料夾（需要 Chrome 或 Edge）。</p>
        )}
        {isFolderBackupSupported() && folderStatus && !folderStatus.folderName && (
          <>
            <p className="text-xs text-slate-500 mb-4">
              選擇一個備份資料夾後，資料有變動就會自動寫入當日備份檔（保留最近 14 天），不用再手動匯出。
            </p>
            <button
              onClick={handleChooseFolder}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600/20 border border-primary-600/40 text-primary-400 rounded-lg text-sm hover:bg-primary-600/30 transition-colors"
            >
              <FolderOpen size={15} />
              選擇備份資料夾
            </button>
          </>
        )}
        {isFolderBackupSupported() && folderStatus?.folderName && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <FolderCheck size={15} className="text-emerald-400" />
              備份資料夾：<span className="font-medium">{folderStatus.folderName}</span>
            </div>
            <div className="text-xs text-slate-500">
              上次備份：{folderStatus.lastBackupAt ? formatDateTime(folderStatus.lastBackupAt) : '尚未備份'}
            </div>
            {folderStatus.permission !== 'granted' && (
              <div className="text-xs text-amber-400">
                瀏覽器已收回資料夾權限（隔一段時間會發生），請重新授權以繼續自動備份。
              </div>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              {folderStatus.permission !== 'granted' ? (
                <button
                  onClick={handleReauthorize}
                  className="px-3 py-1.5 bg-amber-600/20 border border-amber-600/40 text-amber-400 rounded-lg text-xs hover:bg-amber-600/30 transition-colors"
                >
                  重新授權
                </button>
              ) : (
                <button
                  onClick={handleBackupNow}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-xs hover:bg-slate-700 transition-colors"
                >
                  立即備份
                </button>
              )}
              <button
                onClick={handleDisable}
                className="px-3 py-1.5 text-slate-500 hover:text-slate-300 text-xs transition-colors"
              >
                停用自動備份
              </button>
            </div>
          </div>
        )}
        {backupMessage && <p className="text-xs text-emerald-400 mt-3">{backupMessage}</p>}
      </section>

      {/* 資料快照 */}
      <section className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl max-w-lg mb-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-1">資料快照</h2>
        <p className="text-xs text-slate-500 mb-3">
          每天第一次打開 App 自動保留一份當時的資料（最多 5 份），誤刪或改壞資料時可以還原回那一天的狀態。
        </p>
        {snapshots.length === 0 && <p className="text-xs text-slate-500">還沒有快照。</p>}
        <div className="space-y-2">
          {snapshots.map((s) => (
            <div key={s.date} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <History size={14} className="text-slate-500 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm text-slate-300">{s.date}</div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {s.counts.map((c) => `${c.label} ${c.value}`).join('　·　')}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleRestore(s.date)}
                onMouseLeave={() => { if (confirmRestoreDate === s.date) setConfirmRestoreDate(null); }}
                className={`text-xs px-3 py-1 rounded-lg shrink-0 ml-3 transition-colors ${
                  confirmRestoreDate === s.date
                    ? 'bg-red-600/20 border border-red-600/40 text-red-400'
                    : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {confirmRestoreDate === s.date ? '確認還原?' : '還原'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 資料備份 */}
      <section className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl max-w-lg">
        <h2 className="text-sm font-semibold text-slate-300 mb-1">手動備份</h2>
        <p className="text-xs text-slate-500 mb-4">
          所有資料存在瀏覽器本機。匯出的 JSON 可以在其他電腦或瀏覽器匯入還原。
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
