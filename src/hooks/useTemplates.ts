import { useEffect, useState } from 'react';
import type { Template, TemplateCategory, TemplateStep } from '../types';
import { loadFromStorage, newId, saveToStorage, STORAGE_KEYS } from '../services/storage';
import { buildSeedCategories, buildSeedTemplates } from '../services/seedTemplates';

export function useTemplates() {
  const [categories, setCategories] = useState<TemplateCategory[]>(() =>
    loadFromStorage(STORAGE_KEYS.templateCategories, [] as TemplateCategory[])
  );
  const [templates, setTemplates] = useState<Template[]>(() =>
    loadFromStorage(STORAGE_KEYS.templates, [] as Template[])
  );

  // 第一次載入且尚未有任何分類資料時，寫入種子資料。
  useEffect(() => {
    if (categories.length === 0 && templates.length === 0) {
      const seedCategories = buildSeedCategories();
      const seedTemplates = buildSeedTemplates();
      setCategories(seedCategories);
      setTemplates(seedTemplates);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.templateCategories, categories);
  }, [categories]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.templates, templates);
  }, [templates]);

  function addCategory(name: string) {
    setCategories((prev) => [...prev, { id: newId(), name }]);
  }

  function renameCategory(id: string, name: string) {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
  }

  function deleteCategory(id: string) {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setTemplates((prev) => prev.filter((t) => t.categoryId !== id));
  }

  function addTemplate(categoryId: string, name: string) {
    const newTemplate: Template = { id: newId(), categoryId, name, steps: [] };
    setTemplates((prev) => [...prev, newTemplate]);
    return newTemplate.id;
  }

  function duplicateTemplate(templateId: string) {
    setTemplates((prev) => {
      const source = prev.find((t) => t.id === templateId);
      if (!source) return prev;
      const clone: Template = {
        ...structuredClone(source),
        id: newId(),
        name: source.name + '（複製）',
        isDefault: false
      };
      return [...prev, clone];
    });
  }

  function deleteTemplate(templateId: string) {
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
  }

  function renameTemplate(templateId: string, name: string) {
    setTemplates((prev) => prev.map((t) => (t.id === templateId ? { ...t, name } : t)));
  }

  function setDefaultTemplate(categoryId: string, templateId: string) {
    setTemplates((prev) =>
      prev.map((t) => (t.categoryId === categoryId ? { ...t, isDefault: t.id === templateId } : t))
    );
  }

  function updateTemplateSteps(templateId: string, steps: TemplateStep[]) {
    setTemplates((prev) => prev.map((t) => (t.id === templateId ? { ...t, steps } : t)));
  }

  return {
    categories,
    templates,
    addCategory,
    renameCategory,
    deleteCategory,
    addTemplate,
    duplicateTemplate,
    deleteTemplate,
    renameTemplate,
    setDefaultTemplate,
    updateTemplateSteps
  };
}
