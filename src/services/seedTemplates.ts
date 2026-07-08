import type { Template, TemplateCategory, TemplateStep } from '../types';
import { newId } from './storage';

// 種子資料：兩個內建分類、三份預設範本。對應 REQUIREMENTS.md 的公版流程。
// 之後使用者可以在 Settings 裡自由編輯、複製、新增分類/範本，這裡只是第一次載入時的初始值。

function step(name: string, groupOrder: number, opts: Partial<TemplateStep> = {}): TemplateStep {
  return { id: newId(), name, groupOrder, ...opts };
}

export function buildSeedCategories(): TemplateCategory[] {
  return [
    { id: 'cat-project-stage', name: '專案階段範本' },
    { id: 'cat-case-workflow', name: '案件流程範本' }
  ];
}

export function buildSeedTemplates(): Template[] {
  const projectStageTemplate: Template = {
    id: newId(),
    categoryId: 'cat-project-stage',
    name: '標準NPI流程',
    isDefault: true,
    steps: [
      step('Kickoff', 1, { checklistItems: ['專案範圍/目標確認', 'PRD 簽核', '時程/資源核准', '跨部門窗口確認'], durationDays: 5 }),
      step('Design', 2, { checklistItems: ['電路/結構設計完成', 'BOM 初版完成', 'Design Review 通過', '關鍵料件尋源/備料確認'], durationDays: 15 }),
      step('EVT', 3, { checklistItems: ['EVT 樣品試產完成', '功能測試通過', '可靠性測試啟動', '已知問題清單建立'], durationDays: 15 }),
      step('DVT', 4, { checklistItems: ['DVT 樣品試產完成', '可靠性測試完整通過', '法規/認證送測啟動', 'ECN 已收斂/BOM Cost 達標'], durationDays: 20 }),
      step('PVT', 5, { checklistItems: ['量產線試產完成', '良率達標', '認證/法規測試通過', '供應鏈量產備料確認'], durationDays: 15 }),
      step('MP', 6, { checklistItems: ['量產首批品保簽收通過', 'SOP/作業指導書完成', '供應鏈量產備料確認', '專案結案報告'], durationDays: 5 })
    ]
  };

  const ecnTemplate: Template = {
    id: newId(),
    categoryId: 'cat-case-workflow',
    name: 'ECN',
    isDefault: true,
    steps: [
      step('變更提出', 1),
      step('影響評估', 2),
      step('相關單位會簽', 3),
      step('核准', 4),
      step('文件/圖面更新', 5),
      step('生產導入', 6),
      step('結案', 7)
    ]
  };

  const altMaterialTemplate: Template = {
    id: newId(),
    categoryId: 'cat-case-workflow',
    name: '替代料',
    steps: [
      step('提出申請', 1),
      step('工程評估', 2),
      step('樣品驗證', 3),
      step('品保/可靠性測試', 4),
      step('簽核核准', 5),
      step('BOM/文件更新', 6),
      step('導入量產', 7),
      step('結案', 8)
    ]
  };

  return [projectStageTemplate, ecnTemplate, altMaterialTemplate];
}
