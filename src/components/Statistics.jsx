import { formatAmount, isToday, isThisMonth } from '../utils/format';
import './Statistics.css';

export default function Statistics({ records }) {
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
  const monthBalance = monthIncome - monthExpense;

  // Category breakdown for this month's expenses
  const categoryMap = {};
  records
    .filter(r => r.type === 'expense' && isThisMonth(r.datetime))
    .forEach(r => {
      categoryMap[r.category] = (categoryMap[r.category] || 0) + r.amount;
    });

  const categoryStats = Object.entries(categoryMap)
    .map(([name, amount]) => ({
      name,
      amount,
      percent: monthExpense > 0 ? (amount / monthExpense) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="statistics">
      <div className="stats-overview">
        <div className="stats-card main">
          <span className="stats-label">本月结余</span>
          <span className={`stats-value ${monthBalance >= 0 ? 'positive' : 'negative'}`}>
            {monthBalance >= 0 ? '+' : ''}{formatAmount(monthBalance)}
          </span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stats-card">
          <span className="stats-label">今日支出</span>
          <span className="stats-value expense">{formatAmount(todayExpense)}</span>
        </div>
        <div className="stats-card">
          <span className="stats-label">今日收入</span>
          <span className="stats-value income">{formatAmount(todayIncome)}</span>
        </div>
        <div className="stats-card">
          <span className="stats-label">本月支出</span>
          <span className="stats-value expense">{formatAmount(monthExpense)}</span>
        </div>
        <div className="stats-card">
          <span className="stats-label">本月收入</span>
          <span className="stats-value income">{formatAmount(monthIncome)}</span>
        </div>
      </div>

      <div className="stats-section">
        <h3 className="stats-section-title">本月支出分类</h3>
        {categoryStats.length === 0 ? (
          <div className="empty-state">本月暂无支出记录</div>
        ) : (
          <div className="category-stats">
            {categoryStats.map(stat => (
              <div key={stat.name} className="category-stat-item">
                <div className="category-stat-header">
                  <span className="category-stat-name">{stat.name}</span>
                  <span className="category-stat-amount">{formatAmount(stat.amount)}</span>
                </div>
                <div className="category-stat-bar">
                  <div
                    className="category-stat-fill"
                    style={{ width: `${stat.percent}%` }}
                  />
                </div>
                <span className="category-stat-percent">{stat.percent.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
