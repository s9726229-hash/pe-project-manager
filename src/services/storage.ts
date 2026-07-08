// localStorage 讀寫層。所有資料都存在瀏覽器本機，沒有後端。
// key 統一加上 "pe-pm:" 前綴，避免跟同網域下其他資料衝突。

const PREFIX = 'pe-pm:';

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

export const STORAGE_KEYS = {
  templateCategories: 'templateCategories',
  templates: 'templates',
  projects: 'projects',
  tasks: 'tasks',
  cases: 'cases',
  notes: 'notes',
  knowledgeCategories: 'knowledgeCategories',
  knowledgeNotes: 'knowledgeNotes'
} as const;

export function newId(): string {
  return crypto.randomUUID();
}
