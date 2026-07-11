import { STORAGE_KEYS } from './storage';

export function exportBackup(): void {
  const data: Record<string, unknown> = {};
  for (const key of Object.values(STORAGE_KEYS)) {
    const raw = localStorage.getItem('pe-pm:' + key);
    if (raw !== null) {
      try { data[key] = JSON.parse(raw); } catch { /* skip corrupted key */ }
    }
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
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
  const validKeys = new Set(Object.values(STORAGE_KEYS));
  for (const [key, value] of Object.entries(data)) {
    if (validKeys.has(key as never)) {
      localStorage.setItem('pe-pm:' + key, JSON.stringify(value));
    }
  }
}
