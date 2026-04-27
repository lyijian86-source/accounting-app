import './TagInput.css';

export default function TagInput({ tags, selectedTags, onChange }) {
  const toggle = (tagName) => {
    if (selectedTags.includes(tagName)) {
      onChange(selectedTags.filter(t => t !== tagName));
    } else {
      onChange([...selectedTags, tagName]);
    }
  };

  return (
    <div className="tag-input">
      {tags.map(tag => (
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
