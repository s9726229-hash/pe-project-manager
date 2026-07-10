import type { KnowledgeCategory } from '../types';

// 種子分類，使用者之後可以自由新增/刪除，這裡只是第一次載入時的預設值。
export function buildSeedKnowledgeCategories(): KnowledgeCategory[] {
  return [
    { id: 'kc-verification', name: '驗證條件' },
    { id: 'kc-pcb', name: 'PCB注意事項' },
    { id: 'kc-other', name: '其他注意事項' },
    { id: 'kc-sample-disposal', name: '驗證樣品處置流程' }
  ];
}
