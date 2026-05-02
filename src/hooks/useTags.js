import { useState, useEffect, useCallback } from 'react';
import { getStorage, setStorage } from '../utils/storage';
import { generateId } from '../utils/format';

const STORAGE_KEY = 'accounting_tags';

const DEFAULT_TAGS = [
  { id: 'tag_breakfast', name: '早餐', categoryId: 'cat_food' },
  { id: 'tag_lunch', name: '午餐', categoryId: 'cat_food' },
  { id: 'tag_dinner', name: '晚餐', categoryId: 'cat_food' },
  { id: 'tag_snack', name: '零食', categoryId: 'cat_food' },
  { id: 'tag_drink', name: '饮料', categoryId: 'cat_food' },
];

const LEGACY_TAG_NAME_MAP = {
  '鏃╅': '早餐',
  '鍗堥': '午餐',
  '鏅氶': '晚餐',
  '闆堕': '零食',
  '楗枡': '饮料',
};

function normalizeTag(tag) {
  if (!tag || typeof tag !== 'object') {
    return null;
  }

  const name = LEGACY_TAG_NAME_MAP[tag.name] || tag.name;
  if (typeof name !== 'string' || !name.trim()) {
    return null;
  }

  const categoryId = typeof tag.categoryId === 'string' && tag.categoryId.trim()
    ? tag.categoryId.trim()
    : null;

  return {
    id: typeof tag.id === 'string' && tag.id ? tag.id : generateId(),
    name: name.trim(),
    categoryId,
  };
}

function normalizeTags(tags) {
  return tags.map(normalizeTag).filter(Boolean);
}

export function useTags() {
  const [tags, setTags] = useState(() => {
    const stored = getStorage(STORAGE_KEY, null);
    if (Array.isArray(stored)) {
      return normalizeTags(stored);
    }

    setStorage(STORAGE_KEY, DEFAULT_TAGS);
    return DEFAULT_TAGS;
  });

  useEffect(() => {
    setStorage(STORAGE_KEY, tags);
  }, [tags]);

  const addTag = useCallback((name, categoryId = null) => {
    const tag = normalizeTag({ id: generateId(), name, categoryId });
    setTags((prev) => [...prev, tag]);
    return tag;
  }, []);

  const updateTag = useCallback((id, name, categoryId = null) => {
    setTags((prev) => prev.map((tag) => (
      tag.id === id ? normalizeTag({ ...tag, name, categoryId }) : tag
    )));
  }, []);

  const deleteTag = useCallback((id) => {
    setTags((prev) => prev.filter((tag) => tag.id !== id));
  }, []);

  const replaceTags = useCallback((nextTags) => {
    setTags(Array.isArray(nextTags) ? normalizeTags(nextTags) : []);
  }, []);

  return { tags, addTag, updateTag, deleteTag, replaceTags };
}
