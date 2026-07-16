// 自動備份，兩層保護：
// 1) 備份資料夾 — File System Access API（Chrome/Edge）。使用者選一次資料夾，
//    handle 存 IndexedDB；之後資料變動 30 秒後自動寫入當日備份檔，保留最近 14 天。
// 2) App 內每日快照 — 存 localStorage，每天第一次打開留一份，保留最近 5 份，
//    誤刪/改壞資料時可一鍵還原，不需要任何授權。

import { applyBackupData, collectBackupData } from './backup';
import { setStorageChangeListener } from './storage';

const SNAPSHOTS_KEY = 'pe-pm:snapshots';
const META_KEY = 'pe-pm:backupMeta';
const KEEP_FILES = 14;
const KEEP_SNAPSHOTS = 5;
const DEBOUNCE_MS = 30_000;

// ── File System Access API 最小型別（lib.dom 還沒收錄 picker/permission）─────
type FsPermission = 'granted' | 'denied' | 'prompt';
interface BackupWritable {
  write(data: string): Promise<void>;
  close(): Promise<void>;
}
interface BackupFileHandle {
  createWritable(): Promise<BackupWritable>;
}
export interface BackupDirHandle {
  readonly name: string;
  queryPermission(desc: { mode: 'readwrite' }): Promise<FsPermission>;
  requestPermission(desc: { mode: 'readwrite' }): Promise<FsPermission>;
  getFileHandle(name: string, opts?: { create?: boolean }): Promise<BackupFileHandle>;
  removeEntry(name: string): Promise<void>;
  keys(): AsyncIterableIterator<string>;
}

export function isFolderBackupSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

// ── IndexedDB：存資料夾 handle（localStorage 存不了 handle 物件）──────────────
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('pe-pm-backup', 1);
    req.onupgradeneeded = () => { req.result.createObjectStore('handles'); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGetHandle(): Promise<BackupDirHandle | undefined> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const req = db.transaction('handles', 'readonly').objectStore('handles').get('dir');
      req.onsuccess = () => resolve(req.result as BackupDirHandle | undefined);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return undefined;
  }
}

async function idbSetHandle(handle: BackupDirHandle | null): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const store = db.transaction('handles', 'readwrite').objectStore('handles');
    const req = handle === null ? store.delete('dir') : store.put(handle, 'dir');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ── 備份資料夾 ────────────────────────────────────────────────────────────────
export interface FolderBackupStatus {
  supported: boolean;
  folderName?: string;
  permission?: FsPermission;
  lastBackupAt?: string;
}

function readMeta(): { lastBackupAt?: string } {
  try { return JSON.parse(localStorage.getItem(META_KEY) ?? '{}'); } catch { return {}; }
}

export async function getFolderBackupStatus(): Promise<FolderBackupStatus> {
  if (!isFolderBackupSupported()) return { supported: false };
  const handle = await idbGetHandle();
  if (!handle) return { supported: true };
  let permission: FsPermission = 'prompt';
  try { permission = await handle.queryPermission({ mode: 'readwrite' }); } catch { /* 視同尚未授權 */ }
  return { supported: true, folderName: handle.name, permission, lastBackupAt: readMeta().lastBackupAt };
}

/** 跳出資料夾選擇視窗（需使用者手勢觸發）。回傳資料夾名稱；使用者取消回傳 null。 */
export async function chooseBackupFolder(): Promise<string | null> {
  const picker = (window as unknown as { showDirectoryPicker?: (opts: { mode: string }) => Promise<BackupDirHandle> }).showDirectoryPicker;
  if (!picker) return null;
  try {
    const handle = await picker.call(window, { mode: 'readwrite' });
    await idbSetHandle(handle);
    await writeFolderBackup();
    return handle.name;
  } catch {
    return null; // 使用者取消或未授權
  }
}

/** 重新授權（瀏覽器隔一段時間會收回權限；需使用者手勢觸發）。 */
export async function reauthorizeFolder(): Promise<boolean> {
  const handle = await idbGetHandle();
  if (!handle) return false;
  try {
    if ((await handle.requestPermission({ mode: 'readwrite' })) !== 'granted') return false;
    return await writeFolderBackup();
  } catch {
    return false;
  }
}

export async function disableFolderBackup(): Promise<void> {
  try { await idbSetHandle(null); } catch { /* ignore */ }
}

/** 寫入當日備份檔（同一天覆蓋同一檔），並清掉超過保留天數的舊檔。 */
export async function writeFolderBackup(): Promise<boolean> {
  try {
    const handle = await idbGetHandle();
    if (!handle) return false;
    if ((await handle.queryPermission({ mode: 'readwrite' })) !== 'granted') return false;

    const today = new Date().toISOString().slice(0, 10);
    const fileHandle = await handle.getFileHandle(`pe-pm-backup-${today}.json`, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(collectBackupData(), null, 2));
    await writable.close();

    const backupFiles: string[] = [];
    for await (const name of handle.keys()) {
      if (/^pe-pm-backup-\d{4}-\d{2}-\d{2}\.json$/.test(name)) backupFiles.push(name);
    }
    backupFiles.sort();
    for (const old of backupFiles.slice(0, Math.max(0, backupFiles.length - KEEP_FILES))) {
      try { await handle.removeEntry(old); } catch { /* 刪不掉就留著 */ }
    }

    localStorage.setItem(META_KEY, JSON.stringify({ lastBackupAt: new Date().toISOString() }));
    return true;
  } catch {
    return false;
  }
}

// ── App 內每日快照 ────────────────────────────────────────────────────────────
interface Snapshot {
  date: string;      // YYYY-MM-DD
  savedAt: string;   // ISO datetime
  data: Record<string, unknown>;
}

export interface SnapshotInfo {
  date: string;
  savedAt: string;
  counts: { label: string; value: number }[];
}

function loadSnapshots(): Snapshot[] {
  try {
    const arr = JSON.parse(localStorage.getItem(SNAPSHOTS_KEY) ?? '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveSnapshots(snapshots: Snapshot[]): void {
  // localStorage 有容量上限；塞不下就丟掉最舊的再試，最後放棄（快照失敗不能影響 App 本體）。
  const pending = [...snapshots];
  while (pending.length > 0) {
    try {
      localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(pending));
      return;
    } catch {
      pending.shift();
    }
  }
}

function countOf(data: Record<string, unknown>, key: string): number {
  const v = data[key];
  return Array.isArray(v) ? v.length : 0;
}

function toInfo(s: Snapshot): SnapshotInfo {
  return {
    date: s.date,
    savedAt: s.savedAt,
    counts: [
      { label: '專案', value: Math.max(0, countOf(s.data, 'projects') - 1) }, // 扣掉虛擬「日常行政」專案
      { label: '待辦', value: countOf(s.data, 'tasks') },
      { label: '案件', value: countOf(s.data, 'cases') },
      { label: '知識庫', value: countOf(s.data, 'knowledgeNotes') },
    ],
  };
}

export function getSnapshots(): SnapshotInfo[] {
  return loadSnapshots().map(toInfo).reverse(); // 新的在前
}

/** 每天第一次打開 App 時留一份快照。 */
function takeDailySnapshot(): void {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const snapshots = loadSnapshots();
    if (snapshots.some((s) => s.date === today)) return;
    snapshots.push({ date: today, savedAt: new Date().toISOString(), data: collectBackupData() });
    while (snapshots.length > KEEP_SNAPSHOTS) snapshots.shift();
    saveSnapshots(snapshots);
  } catch { /* 快照失敗不影響 App */ }
}

/** 還原到某天的快照。還原前會把「現在」的資料先蓋存成今日快照，讓還原本身也可以反悔。 */
export function restoreSnapshot(date: string): boolean {
  try {
    const snapshots = loadSnapshots();
    const target = snapshots.find((s) => s.date === date);
    if (!target) return false;

    const today = new Date().toISOString().slice(0, 10);
    const current: Snapshot = { date: today, savedAt: new Date().toISOString(), data: collectBackupData() };
    const kept = snapshots.filter((s) => s.date !== today);
    kept.push(current);
    kept.sort((a, b) => (a.date < b.date ? -1 : 1));
    saveSnapshots(kept);

    applyBackupData(target.data);
    return true;
  } catch {
    return false;
  }
}

// ── 初始化 ────────────────────────────────────────────────────────────────────
let debounceTimer: number | undefined;

export function initAutoBackup(): void {
  takeDailySnapshot();

  // 當日還沒寫過備份檔的話，開 App 就先寫一份（已授權才會成功，失敗靜默略過）
  const lastBackupAt = readMeta().lastBackupAt;
  const today = new Date().toISOString().slice(0, 10);
  if (!lastBackupAt || lastBackupAt.slice(0, 10) !== today) {
    void writeFolderBackup();
  }

  // 資料有變動 → 30 秒後寫入備份檔（連續變動只寫最後一次）
  setStorageChangeListener(() => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => { void writeFolderBackup(); }, DEBOUNCE_MS);
  });
}
