import { useState } from 'react';
import Modal from './Modal';
import TagInput from './TagInput';
import { formatAmount, formatDate, toDatetimeLocal, isToday, isThisMonth } from '../utils/format';
import { exportCSV, exportJSON } from '../utils/export';
import './RecordList.css';

export default function RecordList({
  records,
  categories,
  tags,
  onUpdate,
  onDelete,
  onManageCategories,
  onManageTags,
}) {
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showExport, setShowExport] = useState(false);

  const todayExpense = records
    .filter(r => r.type === 'expense' && isToday(r.datetime))
    .reduce((sum, r) => sum + r.amount, 0);
  const todayIncome = records
    .filter(r => r.type === 'income' && isToday(r.datetime))
    .reduce((sum, r) => sum + r.amount, 0);
  const monthExpense = records
    .filter(r => r.type === 'expense' && isThisMonth(r.datetime))
    .reduce((sum, r) => sum + r.amount, 0);
  const monthIncome = records
    .filter(r => r.type === 'income' && isThisMonth(r.datetime))
    .reduce((sum, r) => sum + r.amount, 0);

  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.datetime) - new Date(a.datetime)
  );

  const startEdit = (record) => {
    setEditingRecord(record);
    setEditForm({
      amount: record.amount.toString(),
      type: record.type,
      category: record.category,
      tags: [...record.tags],
      note: record.note || '',
      datetime: toDatetimeLocal(record.datetime),
    });
  };

  const saveEdit = () => {
    if (!editForm.amount || !editForm.category) return;
    onUpdate(editingRecord.id, {
      ...editForm,
      amount: parseFloat(editForm.amount),
      datetime: new Date(editForm.datetime).toISOString(),
    });
    setEditingRecord(null);
  };

  const filteredEditCategories = categories.filter(c => c.type === editForm.type);

  return (
    <div className="record-list">
      <div className="summary-cards">
        <div className="summary-card">
          <span className="summary-label">今日支出</span>
          <span className="summary-value expense">{formatAmount(todayExpense)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">今日收入</span>
          <span className="summary-value income">{formatAmount(todayIncome)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">本月支出</span>
          <span className="summary-value expense">{formatAmount(monthExpense)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">本月收入</span>
          <span className="summary-value income">{formatAmount(monthIncome)}</span>
        </div>
      </div>

      <div className="list-actions">
        <span className="list-count">{records.length} 条记录</span>
        <button className="export-btn" onClick={() => setShowExport(true)}>
          导出
        </button>
      </div>

      {sortedRecords.length === 0 ? (
        <div className="empty-state">暂无记录</div>
      ) : (
        <div className="records">
          {sortedRecords.map(record => (
            <div key={record.id} className="record-item">
              <div className="record-left">
                <span className={`record-category ${record.type}`}>
                  {record.category}
                </span>
                {record.tags.length > 0 && (
                  <div className="record-tags">
                    {record.tags.map(t => (
                      <span key={t} className="record-tag">{t}</span>
                    ))}
                  </div>
                )}
                {record.note && (
                  <span className="record-note">{record.note}</span>
                )}
              </div>
              <div className="record-right">
                <span className={`record-amount ${record.type}`}>
                  {record.type === 'expense' ? '-' : '+'}{formatAmount(record.amount)}
                </span>
                <span className="record-time">{formatDate(record.datetime)}</span>
                <div className="record-actions">
                  <button className="action-btn" onClick={() => startEdit(record)}>
                    编辑
                  </button>
                  <button className="action-btn danger" onClick={() => onDelete(record.id)}>
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        open={!!editingRecord}
        title="编辑记录"
        onClose={() => setEditingRecord(null)}
      >
        {editingRecord && (
          <div className="edit-form">
            <div className="edit-type-switch">
              <button
                type="button"
                className={`type-btn ${editForm.type === 'expense' ? 'active expense' : ''}`}
                onClick={() => setEditForm(f => ({ ...f, type: 'expense', category: '' }))}
              >
                支出
              </button>
              <button
                type="button"
                className={`type-btn ${editForm.type === 'income' ? 'active income' : ''}`}
                onClick={() => setEditForm(f => ({ ...f, type: 'income', category: '' }))}
              >
                收入
              </button>
            </div>

            <div className="edit-field">
              <label>金额</label>
              <input
                type="number"
                step="0.01"
                value={editForm.amount}
                onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))}
              />
            </div>

            <div className="edit-field">
              <label>分类</label>
              <div className="category-grid">
                {filteredEditCategories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`category-item ${editForm.category === cat.name ? 'active' : ''}`}
                    onClick={() => setEditForm(f => ({ ...f, category: cat.name }))}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="edit-field">
              <label>标签</label>
              <TagInput
                tags={tags}
                selectedTags={editForm.tags}
                onChange={tags => setEditForm(f => ({ ...f, tags }))}
              />
            </div>

            <div className="edit-field">
              <label>备注</label>
              <input
                type="text"
                value={editForm.note}
                onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))}
              />
            </div>

            <div className="edit-field">
              <label>时间</label>
              <input
                type="datetime-local"
                value={editForm.datetime}
                onChange={e => setEditForm(f => ({ ...f, datetime: e.target.value }))}
              />
            </div>

            <button className="submit-btn" onClick={saveEdit}>
              保存
            </button>
          </div>
        )}
      </Modal>

      {/* Export Modal */}
      <Modal
        open={showExport}
        title="导出数据"
        onClose={() => setShowExport(false)}
      >
        <div className="export-options">
          <p className="export-desc">将导出全部 {records.length} 条记录</p>
          <button
            className="export-option-btn"
            onClick={() => { exportCSV(records); setShowExport(false); }}
          >
            导出 CSV
          </button>
          <button
            className="export-option-btn"
            onClick={() => { exportJSON(records); setShowExport(false); }}
          >
            导出 JSON
          </button>
        </div>
      </Modal>
    </div>
  );
}
