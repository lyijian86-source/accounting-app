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

  const filteredCategories = categories.filter((item) => item.type === type);
  const selectedCategory = filteredCategories.find((item) => item.name === category) || null;
  const availableTags = (() => {
    if (type !== 'expense' || !selectedCategory) {
      return [];
    }

    return tags.filter((tag) => tag.categoryId === selectedCategory.id);
  })();

  const handleSubmit = (event) => {
    event.preventDefault();
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

  const handleTypeChange = (nextType) => {
    setType(nextType);
    setCategory('');
    setSelectedTags([]);
  };

  const handleCategoryChange = (nextCategory) => {
    setCategory(nextCategory);
    setSelectedTags([]);
  };

  return (
    <form className="record-form" onSubmit={handleSubmit}>
      <div className="type-switch">
        <button
          type="button"
          className={`type-btn ${type === 'expense' ? 'active expense' : ''}`}
          onClick={() => handleTypeChange('expense')}
        >
          支出
        </button>
        <button
          type="button"
          className={`type-btn ${type === 'income' ? 'active income' : ''}`}
          onClick={() => handleTypeChange('income')}
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
          onChange={(event) => setAmount(event.target.value)}
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
          {filteredCategories.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`category-item ${category === item.name ? 'active' : ''}`}
              onClick={() => handleCategoryChange(item.name)}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      {type === 'expense' && (
        <div className="form-section">
          <div className="section-header">
            <span className="section-label">细分标签</span>
            <button type="button" className="manage-btn" onClick={onManageTags}>
              管理
            </button>
          </div>
          <TagInput
            tags={availableTags}
            selectedTags={selectedTags}
            onChange={setSelectedTags}
            emptyMessage={selectedCategory ? '这个分类下还没有细分标签' : '先选分类，再选细分标签'}
          />
        </div>
      )}

      <div className="form-section">
        <span className="section-label">备注</span>
        <input
          type="text"
          placeholder="添加备注..."
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>

      <div className="form-section">
        <span className="section-label">时间</span>
        <input
          type="datetime-local"
          value={datetime}
          onChange={(event) => setDatetime(event.target.value)}
        />
      </div>

      <button type="submit" className="submit-btn" disabled={!amount || !category}>
        记录
      </button>
    </form>
  );
}
