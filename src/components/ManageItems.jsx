import { useState } from 'react';
import Modal from './Modal';
import './ManageItems.css';

export default function ManageItems({
  open,
  title,
  items,
  type,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
}) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    if (type === 'category') {
      onAdd(name, 'expense'); // will be overridden by caller
    } else {
      onAdd(name);
    }
    setNewName('');
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditName(item.name);
  };

  const saveEdit = () => {
    const name = editName.trim();
    if (!name) return;
    onUpdate(editingId, name);
    setEditingId(null);
    setEditName('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="manage-items">
        <div className="manage-add">
          <input
            type="text"
            placeholder="输入名称..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <button className="add-btn" onClick={handleAdd} disabled={!newName.trim()}>
            添加
          </button>
        </div>

        <div className="manage-list">
          {items.map(item => (
            <div key={item.id} className="manage-item">
              {editingId === item.id ? (
                <div className="manage-edit-row">
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveEdit();
                      if (e.key === 'Escape') cancelEdit();
                    }}
                    autoFocus
                  />
                  <button className="save-btn" onClick={saveEdit}>保存</button>
                  <button className="cancel-btn" onClick={cancelEdit}>取消</button>
                </div>
              ) : (
                <div className="manage-item-row">
                  <span className="manage-item-name">{item.name}</span>
                  <div className="manage-item-actions">
                    <button className="edit-btn" onClick={() => startEdit(item)}>编辑</button>
                    <button className="delete-btn" onClick={() => onDelete(item.id)}>删除</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <div className="manage-empty">暂无项目</div>
          )}
        </div>
      </div>
    </Modal>
  );
}
