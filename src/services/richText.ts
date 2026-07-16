// Note/KnowledgeNote 的 content 是一段 HTML（支援表格），這裡是共用的純函式：
// 純文字摘要（搜尋結果、列表預覽）、插入表格、清理從 Excel 貼上的表格。

export function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}

const TABLE_CELL_STYLE = 'border:1px solid #334155;padding:6px 10px;vertical-align:top;';
const TABLE_STYLE = 'border-collapse:collapse;width:100%;margin:8px 0;';

export function buildTableHtml(rows: number, cols: number): string {
  const cell = (tag: 'td' | 'th') => `<${tag} style="${TABLE_CELL_STYLE}">&nbsp;</${tag}>`;
  const headerRow = `<tr>${Array.from({ length: cols }, () => cell('th')).join('')}</tr>`;
  const bodyRows = Array.from({ length: Math.max(0, rows - 1) }, () =>
    `<tr>${Array.from({ length: cols }, () => cell('td')).join('')}</tr>`
  ).join('');
  return `<table style="${TABLE_STYLE}"><tbody>${headerRow}${bodyRows}</tbody></table><p><br></p>`;
}

const KEEP_TAGS = new Set(['TABLE', 'THEAD', 'TBODY', 'TR', 'TD', 'TH', 'COLGROUP', 'COL', 'BR']);

/**
 * 從剪貼簿的 HTML（Excel 複製會帶一份）取出表格，剝掉 Excel 塞的 mso-* 樣式/class，
 * 只留基本結構，套用我們自己的深色主題邊框樣式。抓不到表格回傳 null（呼叫端會退回純文字貼上）。
 */
export function extractExcelTable(html: string): string | null {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const table = doc.querySelector('table');
  if (!table) return null;

  table.querySelectorAll('script, style').forEach((el) => el.remove());

  [...table.attributes].forEach((attr) => table.removeAttribute(attr.name));

  table.querySelectorAll('*').forEach((el) => {
    [...el.attributes].forEach((attr) => {
      if (attr.name.toLowerCase() !== 'colspan' && attr.name.toLowerCase() !== 'rowspan') {
        el.removeAttribute(attr.name);
      }
    });
    if (el.tagName === 'TD' || el.tagName === 'TH') {
      el.setAttribute('style', TABLE_CELL_STYLE);
    } else if (!KEEP_TAGS.has(el.tagName)) {
      // Excel 常把每個儲存格文字包一層 <span>/<font>，不需要的標籤直接攤平成純文字
      el.replaceWith(...el.childNodes);
    }
  });
  table.setAttribute('style', TABLE_STYLE);

  return table.outerHTML;
}
