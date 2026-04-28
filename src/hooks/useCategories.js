import { useState, useEffect, useCallback } from 'react';
import { getStorage, setStorage } from '../utils/storage';
import { generateId } from '../utils/format';

const STORAGE_KEY = 'accounting_categories';

const DEFAULT_CATEGORIES = [
  { id: 'cat_food', name: '餐饮', type: 'expense' },
  { id: 'cat_bath', name: '洗浴', type: 'expense' },
  { id: 'cat_ai', name: 'AI', type: 'expense' },
  { id: 'cat_transport', name: '交通', type: 'expense' },
  { id: 'cat_social', name: '社交', type: 'expense' },
  { id: 'cat_salary', name: '工资', type: 'income' },
  { id: 'cat_parttime', name: '兼职', type: 'income' },
  { id: 'cat_finance', name: '理财', type: 'income' },
  { id: 'cat_other', name: '其他', type: 'income' },
];

export function useCategories() {
  const [categories, setCategories] = useState(() => {
    const stored = getStorage(STORAGE_KEY, null);
    if (Array.isArray(stored)) return stored;
    setStorage(STORAGE_KEY, DEFAULT_CATEGORIES);
    return DEFAULT_CATEGORIES;
  });

  useEffect(() => {
    setStorage(STORAGE_KEY, categories);
  }, [categories]);

  const addCategory = useCallback((name, type) => {
    const cat = { id: generateId(), name, type };
    setCategories(prev => [...prev, cat]);
    return cat;
  }, []);

  const updateCategory = useCallback((id, name) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c));
  }, []);

  const deleteCategory = useCallback((id) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  const replaceCategories = useCallback((nextCategories) => {
    setCategories(Array.isArray(nextCategories) ? nextCategories : []);
  }, []);

  const getCategoriesByType = useCallback((type) => {
    return categories.filter(c => c.type === type);
  }, [categories]);

  return { categories, addCategory, updateCategory, deleteCategory, replaceCategories, getCategoriesByType };
}
