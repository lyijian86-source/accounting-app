import { useState, useEffect, useCallback } from 'react';
import { getStorage, setStorage } from '../utils/storage';
import { generateId } from '../utils/format';

const STORAGE_KEY = 'accounting_records';

export function useRecords() {
  const [records, setRecords] = useState(() => {
    const stored = getStorage(STORAGE_KEY, []);
    return Array.isArray(stored) ? stored : [];
  });

  useEffect(() => {
    setStorage(STORAGE_KEY, records);
  }, [records]);

  const addRecord = useCallback((data) => {
    const record = {
      id: generateId(),
      amount: parseFloat(data.amount),
      type: data.type,
      category: data.category,
      tags: data.tags || [],
      note: data.note || '',
      datetime: data.datetime || new Date().toISOString(),
    };
    setRecords(prev => [record, ...prev]);
    return record;
  }, []);

  const updateRecord = useCallback((id, data) => {
    setRecords(prev => prev.map(r =>
      r.id === id ? { ...r, ...data, amount: parseFloat(data.amount || r.amount) } : r
    ));
  }, []);

  const deleteRecord = useCallback((id) => {
    setRecords(prev => prev.filter(r => r.id !== id));
  }, []);

  return { records, addRecord, updateRecord, deleteRecord };
}
