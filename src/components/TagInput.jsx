import './TagInput.css';

export default function TagInput({ tags, selectedTags, onChange, emptyMessage = '暂无可选标签' }) {
  const toggle = (tagName) => {
    if (selectedTags.includes(tagName)) {
      onChange(selectedTags.filter((tag) => tag !== tagName));
    } else {
      onChange([...selectedTags, tagName]);
    }
  };

  if (!tags.length) {
    return <div className="tag-empty">{emptyMessage}</div>;
  }

  return (
    <div className="tag-input">
      {tags.map((tag) => (
        <button
          key={tag.id}
          type="button"
          className={`tag-chip ${selectedTags.includes(tag.name) ? 'active' : ''}`}
          onClick={() => toggle(tag.name)}
        >
          {tag.name}
        </button>
      ))}
    </div>
  );
}
