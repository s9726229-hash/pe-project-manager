import { useEffect, useState } from 'react';
import type { KnowledgeCategory, KnowledgeNote } from '../types';
import { loadFromStorage, newId, saveToStorage, STORAGE_KEYS } from '../services/storage';
import { buildSeedKnowledgeCategories } from '../services/seedKnowledge';

function nowIso(): string {
  return new Date().toISOString();
}

export function useKnowledge() {
  const [categories, setCategories] = useState<KnowledgeCategory[]>(() =>
    loadFromStorage(STORAGE_KEYS.knowledgeCategories, [] as KnowledgeCategory[])
  );
  const [notes, setNotes] = useState<KnowledgeNote[]>(() => loadFromStorage(STORAGE_KEYS.knowledgeNotes, [] as KnowledgeNote[]));

  useEffect(() => {
    if (categories.length === 0) setCategories(buildSeedKnowledgeCategories());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.knowledgeCategories, categories);
  }, [categories]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.knowledgeNotes, notes);
  }, [notes]);

  function addCategory(name: string) {
    setCategories((prev) => [...prev, { id: newId(), name }]);
  }

  function renameCategory(id: string, name: string) {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
  }

  function deleteCategory(id: string) {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setNotes((prev) => prev.filter((n) => n.categoryId !== id));
  }

  function addNote(categoryId: string, title: string, content: string) {
    const note: KnowledgeNote = { id: newId(), categoryId, title, content, createdAt: nowIso(), updatedAt: nowIso() };
    setNotes((prev) => [note, ...prev]);
    return note.id;
  }

  function updateNote(id: string, patch: Partial<KnowledgeNote>) {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: nowIso() } : n)));
  }

  function deleteNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  return { categories, notes, addCategory, renameCategory, deleteCategory, addNote, updateNote, deleteNote };
}
