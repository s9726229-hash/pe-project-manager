import { useEffect, useState } from 'react';
import type { Program } from '../types';
import { loadFromStorage, newId, saveToStorage, STORAGE_KEYS } from '../services/storage';

export function usePrograms() {
  const [programs, setPrograms] = useState<Program[]>(() => loadFromStorage(STORAGE_KEYS.programs, [] as Program[]));

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.programs, programs);
  }, [programs]);

  function addProgram(code: string, name: string) {
    const program: Program = { id: newId(), code, name };
    setPrograms((prev) => [...prev, program]);
    return program.id;
  }

  function deleteProgram(id: string) {
    setPrograms((prev) => prev.filter((p) => p.id !== id));
  }

  return { programs, addProgram, deleteProgram };
}
