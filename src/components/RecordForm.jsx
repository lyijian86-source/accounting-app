import { useState } from 'react';
import TagInput from './TagInput';
import { toDatetimeLocal } from '../utils/format';
import './RecordForm.css';

export default function RecordForm({
  categories,
  tags,
  onSubmit,
  onManageCategories,
  onManageTags,
}) {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [note, setNote] = useState('');
  const [datetime, setDatetime] = useState(toDatetimeLocal());

  const filteredCategories = categories.filter(c => c.type === type);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    if (!category) return;

    onSubmit({
      amount: parseFloat(amount),
      type,
      category,
      tags: selectedTags,
      note,
      datetime: new Date(datetime).toISOString(),
    });

    setAmount('');
    setCategory('');
    setSelectedTags([]);
    setNote('');
    setDatetime(toDatetimeLocal());
  };

  return (
    <form className="record-form" onSubmit={handleSubmit}>
      <div className="type-switch">
        <button
          type="button"
          className={`type-btn ${type === 'expense' ? 'active expense' : ''}`}
          onClick={() => { setType('expense'); setCategory(''); }}
        >
          支出
        </button>
        <button
          type="button"
          className={`type-btn ${type === 'income' ? 'active income' : ''}`}
          onClick={() => { setType('income'); setCategory(''); }}
        >
          收入
        </button>
      </div>

      <div className="amount-input">
        <span className="amount-symbol">{type === 'expense' ? '-' : '+'}</span>
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          autoFocus
        />
      </div>

      <div className="form-section">
        <div className="section-header">
          <span className="section-label">分类</span>
          <button type="button" className="manage-btn" onClick={onManageCategories}>
            管理
          </button>
        </div>
        <div className="category-grid">
          {filteredCategories.map(cat => (
            <button
              key={cat.id}
              type="button"
              className={`category-item ${category === cat.name ? 'active' : ''}`}
              onClick={() => setCategory(cat.name)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="form-section">
        <div className="section-header">
          <span className="section-label">标签</span>
          <button type="button" className="manage-btn" onClick={onManageTags}>
            管理
          </button>
        </div>
        <TagInput
          tags={tags}
          selectedTags={selectedTags}
          onChange={setSelectedTags}
        />
      </div>

      <div className="form-section">
        <span className="section-label">备注</span>
        <input
          type="text"
          placeholder="添加备注..."
          value={note}
          onChange={e => setNote(e.target.value)}
        />
      </div>

      <div className="form-section">
        <span className="section-label">时间</span>
        <input
          type="datetime-local"
          value={datetime}
          onChange={e => setDatetime(e.target.value)}
        />
      </div>

      <button type="submit" className="submit-btn" disabled={!amount || !category}>
        记录
      </button>
    </form>
  );
}
