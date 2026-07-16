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

// 資料變動通知：自動備份用它得知「有東西存檔了」，不用每個 hook 各自通知。
let changeListener: (() => void) | null = null;
export function setStorageChangeListener(cb: (() => void) | null): void {
  changeListener = cb;
}

export function saveToStorage<T>(key: string, value: T): void {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
  changeListener?.();
}

export const STORAGE_KEYS = {
  templateCategories: 'templateCategories',
  templates: 'templates',
  programs: 'programs',
  projects: 'projects',
  tasks: 'tasks',
  cases: 'cases',
  notes: 'notes',
  documents: 'documents',
  knowledgeCategories: 'knowledgeCategories',
  knowledgeNotes: 'knowledgeNotes'
} as const;

export function newId(): string {
  return crypto.randomUUID();
}
