import type { Note } from '../../types';

interface NotesTabProps {
  note: Note | undefined;
  onSave: (content: string) => void;
}

function formatDate(iso: string): string {
  return iso.slice(0, 16).replace('T', ' ');
}

// 大白板風格：一個專案就一塊自由書寫的區域，不用像清單一樣一筆一筆新增。
export default function NotesTab({ note, onSave }: NotesTabProps) {
  return (
    <div>
      <textarea
        className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-sm resize-none outline-none focus:border-slate-600"
        rows={20}
        placeholder="這裡是這個專案的備忘白板，隨手記點什麼..."
        value={note?.content ?? ''}
        onChange={(e) => onSave(e.target.value)}
      />
      {note && <div className="text-xs text-slate-500 mt-2">最後更新：{formatDate(note.updatedAt)}</div>}
    </div>
  );
}
