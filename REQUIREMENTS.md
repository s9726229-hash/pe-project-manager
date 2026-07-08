# PE Project Manager — 需求規格文件

> 最後更新：2026-07-08（需求討論定案版本）

## 專案定位

NPI（New Product Introduction）工程師專用的專案管理／日常事項備忘軟體。單人使用、無需登入或多人協作，架構仿照使用者既有的 FinTrack AI（React + TypeScript + Vite，Tailwind CSS，資料存在瀏覽器 localStorage，部署到 GitHub Pages）。

---

## 一、核心資料模型

### 1. Project（專案）

```
Project { id, code, name, productLine, startDate, appliedTemplateId, status, owner, notes }
```

- `status`：進行中 / 暫停 / 取消 / 已完成
- `owner`：自由文字（不建人員清單）
- `startDate`：建立時填的啟動日，作為套用範本自動排程的起算點
- 目標量產日：不另存欄位，就是範本自動排出來的 MP 里程碑日期
- 欄位刻意精簡：不含客戶、目標成本/年出貨量、公司內部專案編號

### 2. Milestone（里程碑，遞迴巢狀）

```
Milestone {
  id, name, groupOrder,
  plannedDate, actualDate, owner, status,
  checklistItems?: ChecklistItem[],
  subMilestones?: Milestone[]
}
```

- 由套用「專案階段範本」自動生成
- **並行分組**：同 `groupOrder` 的項目並行，全部完成才進下一組（可以有多組並行，不限一組）
- **巢狀（大類/小類）**：大類（如 Design）底下可以有小類（如 線路/Layout），目前先支援兩層
- **重要規則**：有子項目的「大類」節點本身不記錄日期/負責人/checklist/工期，純粹是分組容器；只有沒有子項目的「葉節點」才有實際追蹤資料，大類的完成狀態由子項目推算
- **工作日自動排程**：範本步驟可設定 `durationDays`（工作天），只跳過週六日，不排除國定假日；填專案啟動日後自動排出全部里程碑日期

### 3. Task（每日待辦，遞迴巢狀）

```
Task {
  id, projectId,           // 必填，沒有專屬專案的雜項掛在虛擬「日常行政/雜項」專案下
  title, dueDate,
  status: '待辦' | '進行中' | '已完成',
  urgent: boolean,          // 急件旗標（特別標記），非三級優先度
  recurring?: { frequency: 'daily'|'weekly'|'monthly', weekday?, dayOfMonth? },
  postponeHistory?: [{ oldDate, newDate, reason? }],  // 原因選填
  completedAt?,
  subTasks?: Task[]         // 可臨時新增子項目，扁平無序、不分組
}
```

- 排序依到期日，不用優先度分級
- 有子任務的父項目，狀態由子項目推算（跟 Milestone 同邏輯）

### 4. Note（專案內自由筆記）

```
Note { id, projectId, content, createdAt, updatedAt }
```

- 純文字備忘，沒有到期日、不用打勾完成，跟 Task／正式會議記錄都不同

### 5. Case（Issue / ECN / 替代料案件）

```
Case { id, projectId, templateId, stepStatuses: [{ stepId, status: 'pending'|'in-progress'|'done', completedDate, owner, note }] }
```

- 套用「案件流程範本」，並行分組步驟（同 Milestone 的 groupOrder 機制）
- 「目前卡在哪一關」＝最小的、還沒全部完成的並行群組

### 6. Template 系統（範本引擎，可自訂擴充）

```
TemplateCategory { id, name }   // 使用者可自訂新增，內建：專案階段範本、案件流程範本
Template { id, categoryId, name, isDefault, steps: TemplateStep[] }
TemplateStep { id, name, groupOrder, checklistItems?: string[], subSteps?: TemplateStep[] }
```

- 分類、範本本身都可以新增/編輯/複製/刪除
- 套用範本後，生成的 Milestone/Case 步驟仍可自由增刪，不受範本鎖死
- 新分類（例如未來想加「會議議程範本」）資料層直接能建，但要等對應功能做出來才會自動套用——這個限制使用者已確認可接受

**種子範本（預設資料，之後可隨時調整）：**

專案階段範本（Kickoff → Design → EVT → DVT → PVT → MP）：
1. Kickoff — exit criteria：專案範圍/目標確認、PRD 簽核、時程/資源核准、跨部門窗口確認
2. Design — exit criteria：電路/結構設計完成、BOM 初版完成、Design Review 通過、關鍵料件尋源/備料確認
3. EVT — exit criteria：EVT 樣品試產完成、功能測試通過、可靠性測試啟動、已知問題清單建立
4. DVT — exit criteria：DVT 樣品試產完成、可靠性測試完整通過、法規/認證送測啟動、ECN 已收斂/BOM Cost 達標
5. PVT — exit criteria（草案，屆時再細看是否要補子項目）：量產線試產完成、良率達標、認證/法規測試通過、供應鏈量產備料確認
6. MP — exit criteria：量產首批品保簽收通過、SOP/作業指導書完成、供應鏈量產備料確認、專案結案報告

替代料公版流程：提出申請 → 工程評估 → 樣品驗證 → 品保/可靠性測試 → 簽核核准 → BOM/文件更新 → 導入量產 → 結案

ECN 公版流程：變更提出 → 影響評估 → 相關單位會簽 → 核准 → 文件/圖面更新 → 生產導入 → 結案

### 7. KnowledgeNote（全域知識庫/SOP，獨立於專案外）

```
KnowledgeCategory { id, name }   // 種子分類：驗證條件、PCB注意事項、其他注意事項、驗證樣品處置流程
KnowledgeNote { id, categoryId, title?, content, createdAt, updatedAt }
```

- 跟專案完全獨立，不做 Project↔KnowledgeNote 引用連結
- 分類可自訂新增

---

## 二、主要畫面

### Dashboard（首頁）
- 今日待辦精簡卡片（`dueDate <= 今天 且未完成`），含「查看全部」連結到 Task 總覽頁
- 未結案問題/ECN 案件數
- 進行中專案概覽卡片（目前階段、進度%、下一個里程碑日期）
- 不放多專案疊在一起的大甘特圖

### Project 列表頁
- 欄位：專案代號/名稱、產品線、狀態、目前階段（含子項目）、進度%

### Project 詳情頁（4 個分頁，頂部不放圖表）
1. **排程進度**：表格視圖（依今天日期標示進行中/逾期/未開始）＋ 甘特圖視圖，可切換
2. **備忘事項**：專案內的 Note 自由筆記
3. **問題/ECN案件**：這個專案的 Case 清單
4. **文件/會議記錄**：文件連結、正式會議記錄（欄位細節暫不深入設計）

### Task 總覽頁（跨專案）
- 檢視切換：依到期日排序（預設）／依專案分組
- 已完成項目預設隱藏，可切換顯示

### 行事曆檢視（新增確認項目）
- App 內建月曆畫面，顯示跨專案的 Task（到期日）與 Milestone（預計日期）
- 使用者已有外部行事曆軟體，但仍希望 App 內建這個檢視，不是匯出/同步整合

### 知識庫頁
- 全域 SOP/注意事項，依分類瀏覽

### Settings
- 範本管理（分類/範本/步驟 CRUD）
- 資料匯出（全部資料存成 JSON）／匯入還原

### 全域搜尋
- 跨 Project / Task / Case / Note / KnowledgeNote 關鍵字搜尋

---

## 三、明確排除的項目（不做，避免過度設計）

- 多人協作、後端伺服器、帳號系統
- 優先度分級（改用「急件」boolean 旗標）
- 自由標籤 Tag 系統
- Kanban 看板視圖
- 瀏覽器推播通知（檢視 Dashboard 即可）
- 週報彙整（先不用）
- Case/ECN 案件的自動排程（只有 Project 範本需要）
- 假日行事曆（排程只跳過週六日）
- 新增範本分類後自動套用進功能（使用者接受手動套用）
- 專案與知識庫互相引用連結

---

## 四、分階段開發計畫

使用者要求「一小塊一小塊執行，每完成一小塊參與測試驗證，完成後再執行下一區塊」。

| 階段 | 內容 | 驗證方式 |
|---|---|---|
| 0. 專案骨架 | Vite+React+TS+Tailwind、GitHub repo、Actions 部署 Pages、導覽列＋空頁面殼子 | 開發環境跑得起來、能切換空頁面、能部署上線 |
| 1. 範本系統 | types.ts、storage.ts（localStorage）、Template/TemplateCategory CRUD＋管理畫面、種子資料 | Settings 新增/編輯/複製範本，重整頁面資料還在 |
| 2. Project 核心 | Project CRUD、套範本自動產生 Milestone（工作日排程）、專案列表頁、排程進度分頁 | 建專案、套範本、看到自動排程、逐項編輯 |
| 3. Task 待辦 | Task CRUD（子任務/重複/順延）、Task 總覽頁、Dashboard 今日待辦卡片 | 新增/完成/順延/展開子任務，兩處同步確認 |
| 4. Case 案件 | Case CRUD、套案件流程範本、並行步驟追蹤、專案內問題分頁 | 開替代料案件走並行步驟，確認進度邏輯 |
| 5. 筆記類功能 | Note、文件/會議記錄、KnowledgeNote＋知識庫頁 | 三種筆記功能各自測試 |
| 6. Dashboard＋行事曆 | 完整組裝 Dashboard、月曆檢視 | 整體可用性、月曆顯示正確 |
| 7. 搜尋＋備份 | 全域搜尋、JSON 匯出/匯入 | 搜尋準確性、匯出後清空重匯入驗證資料復原 |

每個階段結束都是可以實際打開瀏覽器操作測試的完整狀態，不會停在半成品。
