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

  function addNote(projectId: string, content: string) {
    const note: Note = { id: newId(), projectId, content, createdAt: nowIso(), updatedAt: nowIso() };
    setNotes((prev) => [note, ...prev]);
    return note.id;
  }

  function updateNote(id: string, content: string) {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, content, updatedAt: nowIso() } : n)));
  }

  function deleteNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  return { notes, addNote, updateNote, deleteNote };
}
