import type { Template, TemplateCategory, TemplateStep } from '../types';
import { newId } from './storage';

// 種子資料：兩個內建分類、三份預設範本。對應 REQUIREMENTS.md 的公版流程。
// 之後使用者可以在 Settings 裡自由編輯、複製、新增分類/範本，這裡只是第一次載入時的初始值。

function step(name: string, groupOrder: number, opts: Partial<TemplateStep> = {}): TemplateStep {
  return { id: newId(), name, groupOrder, ...opts };
}

// 大類（有子項目的分組節點）：不帶自己的 checklist/工期，只有名稱＋子項目。
function stageGroup(name: string, groupOrder: number, subSteps: TemplateStep[]): TemplateStep {
  return { id: newId(), name, groupOrder, subSteps };
}

// 子項目（葉節點）：自己有工期，之後套用範本時會各自算出日期/負責人/狀態。
function subItem(name: string, groupOrder: number, durationDays: number): TemplateStep {
  return { id: newId(), name, groupOrder, durationDays };
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
      stageGroup('Kickoff', 1, [
        subItem('專案範圍/目標確認', 1, 1),
        subItem('PRD 簽核', 2, 1),
        subItem('時程/資源核准', 2, 2),
        subItem('跨部門窗口確認', 3, 1)
      ]),
      stageGroup('Design', 2, [
        subItem('電路/結構設計完成', 1, 8),
        subItem('BOM 初版完成', 2, 3),
        subItem('關鍵料件尋源/備料確認', 2, 4),
        subItem('Design Review 通過', 3, 2)
      ]),
      stageGroup('EVT', 3, [
        subItem('EVT 樣品試產完成', 1, 5),
        subItem('功能測試通過', 2, 4),
        subItem('可靠性測試啟動', 2, 3),
        subItem('已知問題清單建立', 3, 3)
      ]),
      stageGroup('DVT', 4, [
        subItem('DVT 樣品試產完成', 1, 6),
        subItem('可靠性測試完整通過', 2, 6),
        subItem('法規/認證送測啟動', 2, 4),
        subItem('ECN 已收斂/BOM Cost 達標', 3, 4)
      ]),
      stageGroup('PVT', 5, [
        subItem('量產線試產完成', 1, 5),
        subItem('良率達標', 2, 4),
        subItem('認證/法規測試通過', 2, 4),
        subItem('供應鏈量產備料確認', 3, 2)
      ]),
      stageGroup('MP', 6, [
        subItem('量產首批品保簽收通過', 1, 1),
        subItem('SOP/作業指導書完成', 2, 1),
        subItem('供應鏈量產備料確認', 2, 2),
        subItem('專案結案報告', 3, 1)
      ])
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
