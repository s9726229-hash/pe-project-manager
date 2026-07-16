import { STORAGE_KEYS } from './storage';

/** 收集所有資料，匯出/自動備份/快照共用同一種格式，可互相還原。 */
export function collectBackupData(): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const key of Object.values(STORAGE_KEYS)) {
    const raw = localStorage.getItem('pe-pm:' + key);
    if (raw !== null) {
      try { data[key] = JSON.parse(raw); } catch { /* skip corrupted key */ }
    }
  }
  return data;
}

/** 把備份資料寫回 localStorage（只認得已知的 key，其他忽略）。 */
export function applyBackupData(data: Record<string, unknown>): void {
  const validKeys = new Set(Object.values(STORAGE_KEYS));
  for (const [key, value] of Object.entries(data)) {
    if (validKeys.has(key as never)) {
      localStorage.setItem('pe-pm:' + key, JSON.stringify(value));
    }
  }
}

export function exportBackup(): void {
  const blob = new Blob([JSON.stringify(collectBackupData(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pe-pm-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importBackup(file: File): Promise<void> {
  const text = await file.text();
  const data = JSON.parse(text) as Record<string, unknown>;
  applyBackupData(data);
}
