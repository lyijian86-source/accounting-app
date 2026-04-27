import './Header.css';

const TABS = [
  { key: 'add', label: '记账' },
  { key: 'list', label: '记录' },
  { key: 'stats', label: '统计' },
];

export default function Header({ activeTab, onTabChange }) {
  return (
    <header className="header">
      <div className="header-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`header-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
}
