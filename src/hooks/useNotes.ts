import { useEffect, useState } from 'react';
import type { Note } from '../types';
import { loadFromStorage, newId, saveToStorage, STORAGE_KEYS } from '../services/storage';

function nowIso(): string {
  return new Date().toISOString();
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(() => loadFromStorage(STORAGE_KEYS.notes, [] as Note[]));

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.notes, notes);
  }, [notes]);

  // 大白板風格：一個專案只有一份筆記，第一次存的時候才建立，之後都是更新同一筆。
  function saveNote(projectId: string, content: string) {
    setNotes((prev) => {
      const existing = prev.find((n) => n.projectId === projectId);
      if (existing) {
        return prev.map((n) => (n.id === existing.id ? { ...n, content, updatedAt: nowIso() } : n));
      }
      const note: Note = { id: newId(), projectId, content, createdAt: nowIso(), updatedAt: nowIso() };
      return [...prev, note];
    });
  }

  function deleteNotesByProject(projectId: string) {
    setNotes((prev) => prev.filter((n) => n.projectId !== projectId));
  }

  return { notes, saveNote, deleteNotesByProject };
}
