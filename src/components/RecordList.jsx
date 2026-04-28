import { useRef, useState } from 'react';
import Modal from './Modal';
import TagInput from './TagInput';
import { formatAmount, formatDate, toDatetimeLocal, isToday, isThisMonth } from '../utils/format';
import { exportBackupJSON, exportCSV, exportJSON } from '../utils/export';
import { formatBackupSummary, parseBackupFileContent } from '../utils/backup';
import './RecordList.css';

function buildImportResultMessage(summary) {
  if (summary.mode === 'replace') {
    return `已覆盖为 ${summary.addedRecords} 条记录、${summary.addedCategories} 个分类、${summary.addedTags} 个标签。`;
  }

  return `已新增 ${summary.addedRecords} 条记录、${summary.addedCategories} 个分类、${summary.addedTags} 个标签；跳过 ${summary.skippedRecords} 条重复记录、${summary.skippedCategories} 个重复分类、${summary.skippedTags} 个重复标签。`;
}

export default function RecordList({
  records,
  categories,
  tags,
  onUpdate,
  onDelete,
  onImportBackup,
}) {
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showDataManager, setShowDataManager] = useState(false);
  const [pendingBackup, setPendingBackup] = useState(null);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const fileInputRef = useRef(null);

  const todayExpense = records
    .filter((record) => record.type === 'expense' && isToday(record.datetime))
    .reduce((sum, record) => sum + record.amount, 0);
  const todayIncome = records
    .filter((record) => record.type === 'income' && isToday(record.datetime))
    .reduce((sum, record) => sum + record.amount, 0);
  const monthExpense = records
    .filter((record) => record.type === 'expense' && isThisMonth(record.datetime))
    .reduce((sum, record) => sum + record.amount, 0);
  const monthIncome = records
    .filter((record) => record.type === 'income' && isThisMonth(record.datetime))
    .reduce((sum, record) => sum + record.amount, 0);

  const sortedRecords = [...records].sort(
    (left, right) => new Date(right.datetime) - new Date(left.datetime)
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

  const filteredEditCategories = categories.filter((category) => category.type === editForm.type);

  const openDataManager = () => {
    setImportError('');
    setImportSuccess('');
    setPendingBackup(null);
    setShowDataManager(true);
  };

  const closeDataManager = () => {
    setShowDataManager(false);
    setPendingBackup(null);
    setImportError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerImport = () => {
    setImportError('');
    setImportSuccess('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleBackupFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError('');
    setImportSuccess('');

    try {
      const content = await file.text();
      const payload = parseBackupFileContent(content);
      setPendingBackup({
        filename: file.name,
        payload,
        summary: formatBackupSummary(payload),
      });
    } catch (error) {
      setPendingBackup(null);
      setImportError(error instanceof Error ? error.message : '导入备份失败。');
    }
  };

  const runImport = (mode) => {
    if (!pendingBackup) return;

    const summary = onImportBackup(pendingBackup.payload, mode);
    setImportSuccess(buildImportResultMessage(summary));
    setImportError('');
    setPendingBackup(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
        <button className="export-btn" onClick={openDataManager}>
          数据管理
        </button>
      </div>

      {sortedRecords.length === 0 ? (
        <div className="empty-state">暂无记录</div>
      ) : (
        <div className="records">
          {sortedRecords.map((record) => (
            <div key={record.id} className="record-item">
              <div className="record-left">
                <span className={`record-category ${record.type}`}>
                  {record.category}
                </span>
                {record.tags.length > 0 && (
                  <div className="record-tags">
                    {record.tags.map((tag) => (
                      <span key={tag} className="record-tag">{tag}</span>
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
                onClick={() => setEditForm((form) => ({ ...form, type: 'expense', category: '' }))}
              >
                支出
              </button>
              <button
                type="button"
                className={`type-btn ${editForm.type === 'income' ? 'active income' : ''}`}
                onClick={() => setEditForm((form) => ({ ...form, type: 'income', category: '' }))}
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
                onChange={(event) => setEditForm((form) => ({ ...form, amount: event.target.value }))}
              />
            </div>

            <div className="edit-field">
              <label>分类</label>
              <div className="category-grid">
                {filteredEditCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    className={`category-item ${editForm.category === category.name ? 'active' : ''}`}
                    onClick={() => setEditForm((form) => ({ ...form, category: category.name }))}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="edit-field">
              <label>标签</label>
              <TagInput
                tags={tags}
                selectedTags={editForm.tags}
                onChange={(nextTags) => setEditForm((form) => ({ ...form, tags: nextTags }))}
              />
            </div>

            <div className="edit-field">
              <label>备注</label>
              <input
                type="text"
                value={editForm.note}
                onChange={(event) => setEditForm((form) => ({ ...form, note: event.target.value }))}
              />
            </div>

            <div className="edit-field">
              <label>时间</label>
              <input
                type="datetime-local"
                value={editForm.datetime}
                onChange={(event) => setEditForm((form) => ({ ...form, datetime: event.target.value }))}
              />
            </div>

            <button className="submit-btn" onClick={saveEdit}>
              保存
            </button>
          </div>
        )}
      </Modal>

      <Modal
        open={showDataManager}
        title="数据管理"
        onClose={closeDataManager}
      >
        <div className="data-manager">
          <input
            ref={fileInputRef}
            className="file-input-hidden"
            type="file"
            accept="application/json,.json"
            onChange={handleBackupFileChange}
          />

          <div className="data-manager-section">
            <p className="export-desc">当前本地有 {records.length} 条记录，建议定期导出备份。</p>
            <button
              className="export-option-btn"
              onClick={() => exportBackupJSON({ records, categories, tags })}
            >
              导出备份
            </button>
            <button
              className="export-option-btn secondary"
              onClick={() => exportCSV(records)}
            >
              导出 CSV
            </button>
            <button
              className="export-option-btn secondary"
              onClick={() => exportJSON(records)}
            >
              导出展示 JSON
            </button>
            <button
              className="export-option-btn secondary"
              onClick={triggerImport}
            >
              导入备份
            </button>
          </div>

          {importError && (
            <div className="import-status error">{importError}</div>
          )}

          {importSuccess && (
            <div className="import-status success">{importSuccess}</div>
          )}

          {pendingBackup && (
            <div className="import-preview">
              <div className="import-preview-head">
                <strong>准备导入备份</strong>
                <span>{pendingBackup.filename}</span>
              </div>
              <div className="import-summary-grid">
                <div className="import-summary-item">
                  <span>版本</span>
                  <strong>{pendingBackup.summary.version}</strong>
                </div>
                <div className="import-summary-item">
                  <span>导出时间</span>
                  <strong>{pendingBackup.summary.exportedAt}</strong>
                </div>
                <div className="import-summary-item">
                  <span>记录数</span>
                  <strong>{pendingBackup.summary.recordCount}</strong>
                </div>
                <div className="import-summary-item">
                  <span>分类数</span>
                  <strong>{pendingBackup.summary.categoryCount}</strong>
                </div>
                <div className="import-summary-item">
                  <span>标签数</span>
                  <strong>{pendingBackup.summary.tagCount}</strong>
                </div>
              </div>

              <div className="import-warning">
                <strong>覆盖模式会替换当前本地数据。</strong>
                <span>执行覆盖前，建议先导出一份当前备份。</span>
              </div>

              <div className="import-actions">
                <button
                  className="export-option-btn secondary"
                  onClick={() => runImport('merge')}
                >
                  合并到当前数据
                </button>
                <button
                  className="export-option-btn danger"
                  onClick={() => runImport('replace')}
                >
                  覆盖当前数据
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
