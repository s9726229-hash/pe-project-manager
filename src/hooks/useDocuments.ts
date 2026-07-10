import { useEffect, useState } from 'react';
import type { ProjectDocument } from '../types';
import { loadFromStorage, newId, saveToStorage, STORAGE_KEYS } from '../services/storage';

export interface NewDocumentInput {
  projectId: string;
  type: ProjectDocument['type'];
  title: string;
  date: string;
  content?: string;
}

export function useDocuments() {
  const [documents, setDocuments] = useState<ProjectDocument[]>(() => loadFromStorage(STORAGE_KEYS.documents, [] as ProjectDocument[]));

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.documents, documents);
  }, [documents]);

  function addDocument(input: NewDocumentInput) {
    const doc: ProjectDocument = { id: newId(), ...input };
    setDocuments((prev) => [doc, ...prev]);
    return doc.id;
  }

  function updateDocument(id: string, patch: Partial<ProjectDocument>) {
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  function deleteDocument(id: string) {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  return { documents, addDocument, updateDocument, deleteDocument };
}
