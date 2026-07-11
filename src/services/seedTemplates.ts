import type { Template, TemplateCategory, TemplateStep } from '../types';
import { newId } from './storage';

function step(name: string, groupOrder: number, opts: Partial<TemplateStep> = {}): TemplateStep {
  return { id: newId(), name, groupOrder, ...opts };
}

function stageGroup(name: string, groupOrder: number, subSteps: TemplateStep[]): TemplateStep {
  return { id: newId(), name, groupOrder, subSteps };
}

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
      // ── Phase0: Kickoff / Planning ──
      stageGroup('Kickoff', 1, [
        subItem('NPI 同步會議',   1, 1),
        subItem('2D&3D 圖面',     2, 3),
      ]),

      // ── Phase1: Design ──
      stageGroup('Design', 2, [
        subItem('Schematic',                        1, 5),
        subItem('疊構資料確認(SI)',                  2, 2),
        subItem('疊構資料確認(Layout)',              2, 2),
        subItem('元件尺寸 & 線路確認',               2, 2),
        subItem('Layout Guideline',                 3, 2),
        subItem('Layout checklist',                 4, 2),
        subItem('PCB Simulation Report',            4, 3),
        subItem('EMI/ESD Check',                   4, 2),
        subItem('Valor check',                      4, 1),
        subItem('ME Layout check',                  4, 1),
        subItem('DFM 文件確認',                      5, 1),
        subItem('SI特殊測試需求',                    5, 1),
        subItem('Gerber out',                       6, 1),
        subItem('Sideband profile',                 6, 1),
        subItem('PCB CE Mapping',                   6, 1),
        subItem('審核PCBA版號納入PCB_Mapping',       6, 1),
      ]),

      // ── Phase2: EVT ──
      stageGroup('EVT', 3, [
        subItem('新設計規範(測項)確認',                      1, 2),
        subItem('NAND Configuration Simulation Result',    2, 3),
        subItem('Device type 維護(PM)',                    2, 1),
        subItem('流程卡系統維護',                            2, 1),
        subItem('PCB洗板',                                 3, 1),
        subItem('Power check & Components Location',      3, 2),
        subItem('測試治具',                                  3, 5),
      ]),

      // ── Phase3: DVT ──
      stageGroup('DVT', 4, [
        subItem('新產品試作確認表單',                         1, 2),
        subItem('SMT打樣試產製程報告',                       2, 3),
        subItem('Final BOM/ Schematic',                   2, 2),
        subItem('PCBA approve report (electrical)',        3, 2),
        subItem('Module Reliability Test',                3, 10),
        subItem('包材樣品需求確認',                           3, 2),
        subItem('包裝可靠度測試',                             4, 5),
        subItem('測試產能/技轉',                              4, 3),
        subItem('DVT設計審查確認表(QR2716)',                  5, 1),
      ]),

      // ── Phase4: PVT ──
      stageGroup('PVT', 5, [
        subItem('QC Flow Chart',                1, 2),
        subItem('PCBA Trial Run report',        2, 5),
        subItem('QA Trial Run Report',          2, 5),
        subItem('PVT設計審查確認表(QR2710)',      3, 1),
      ]),

      // ── Phase5: MP ──
      stageGroup('MP', 6, [
        subItem('量產首批品保簽收通過',    1, 1),
        subItem('SOP/作業指導書完成',     2, 1),
        subItem('供應鏈量產備料確認',      2, 2),
        subItem('專案結案報告',           3, 1),
      ]),
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
