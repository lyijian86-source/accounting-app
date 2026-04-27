import { useState, useEffect, useCallback } from 'react';
import { getStorage, setStorage } from '../utils/storage';
import { generateId } from '../utils/format';

const STORAGE_KEY = 'accounting_tags';

const DEFAULT_TAGS = [
  { id: 'tag_breakfast', name: '早餐' },
  { id: 'tag_lunch', name: '午餐' },
  { id: 'tag_dinner', name: '晚餐' },
  { id: 'tag_snack', name: '零食' },
  { id: 'tag_drink', name: '饮料' },
];

export function useTags() {
  const [tags, setTags] = useState(() => {
    const stored = getStorage(STORAGE_KEY, null);
    if (stored) return stored;
    setStorage(STORAGE_KEY, DEFAULT_TAGS);
    return DEFAULT_TAGS;
  });

  useEffect(() => {
    setStorage(STORAGE_KEY, tags);
  }, [tags]);

  const addTag = useCallback((name) => {
    const tag = { id: generateId(), name };
    setTags(prev => [...prev, tag]);
    return tag;
  }, []);

  const updateTag = useCallback((id, name) => {
    setTags(prev => prev.map(t => t.id === id ? { ...t, name } : t));
  }, []);

  const deleteTag = useCallback((id) => {
    setTags(prev => prev.filter(t => t.id !== id));
  }, []);

  return { tags, addTag, updateTag, deleteTag };
}
