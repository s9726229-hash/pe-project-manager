import { useEffect, useRef, useState } from 'react';
import { Table2 } from 'lucide-react';
import { buildTableHtml, extractExcelTable } from '../../services/richText';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

// 極簡的 contentEditable 富文字編輯器：純文字 + 可插入表格 + 從 Excel 貼上自動轉表格。
// 不用第三方編輯器套件，維持這個專案一貫的低依賴風格。
export default function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const savedRange = useRef<Range | null>(null);

  // 只有「外部換了一則不同的筆記」才整段覆寫 DOM，避免每次打字（onChange 回流）洗掉游標位置。
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  function emitChange() {
    onChange(ref.current?.innerHTML ?? '');
  }

  function insertHtmlAtCursor(html: string) {
    ref.current?.focus();
    document.execCommand('insertHTML', false, html);
    emitChange();
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const html = e.clipboardData.getData('text/html');
    if (html && /<table/i.test(html)) {
      const table = extractExcelTable(html);
      if (table) {
        e.preventDefault();
        insertHtmlAtCursor(table + '<p><br></p>');
        return;
      }
    }
    // 一般貼上：只留純文字，不帶入外部網頁/文件的樣式
    const text = e.clipboardData.getData('text/plain');
    if (text) {
      e.preventDefault();
      document.execCommand('insertText', false, text);
      emitChange();
    }
  }

  function openTablePicker() {
    const sel = window.getSelection();
    savedRange.current = sel && sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null;
    setShowTablePicker(true);
  }

  function confirmInsertTable() {
    if (savedRange.current) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedRange.current);
    }
    insertHtmlAtCursor(buildTableHtml(rows, cols));
    setShowTablePicker(false);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="relative flex items-center gap-2 px-2 py-1.5 border-b border-slate-800 shrink-0">
        <button
          type="button"
          onClick={openTablePicker}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800 transition-colors"
        >
          <Table2 size={13} /> 插入表格
        </button>
        <span className="text-[11px] text-slate-600">也可以直接從 Excel 複製貼上</span>

        {showTablePicker && (
          <div className="absolute top-full left-2 mt-1 z-10 flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-lg">
            <label className="text-xs text-slate-400 flex items-center gap-1">
              列
              <input
                type="number" min={1} max={20} value={rows}
                onChange={(e) => setRows(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
                className="w-12 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-xs text-slate-200"
              />
            </label>
            <label className="text-xs text-slate-400 flex items-center gap-1">
              欄
              <input
                type="number" min={1} max={12} value={cols}
                onChange={(e) => setCols(Math.min(12, Math.max(1, Number(e.target.value) || 1)))}
                className="w-12 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-xs text-slate-200"
              />
            </label>
            <button onClick={confirmInsertTable} className="text-xs bg-primary-600 hover:bg-primary-500 rounded px-2 py-1">
              插入
            </button>
            <button onClick={() => setShowTablePicker(false)} className="text-xs text-slate-500 hover:text-slate-300 px-1">
              取消
            </button>
          </div>
        )}
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        onPaste={handlePaste}
        onBlur={emitChange}
        data-placeholder={placeholder}
        className={`rich-editor flex-1 outline-none overflow-auto ${className ?? ''}`}
      />
    </div>
  );
}
