import { useMemo, useState } from 'react';
import { formatAmount, formatDate } from '../utils/format';
import { getStatisticsViewModel } from '../utils/statistics';
import './Statistics.css';

const PERIOD_OPTIONS = [7, 30];

function getBarHeight(amount, maxAmount) {
  if (maxAmount <= 0) {
    return 8;
  }
  return Math.max(8, Math.round((amount / maxAmount) * 100));
}

function TrendBars({ series, compact = false }) {
  const maxAmount = Math.max(...series.map((item) => item.amount), 0);

  return (
    <div className={`trend-bars ${compact ? 'compact' : ''}`}>
      {series.map((item) => (
        <div key={item.key} className="trend-bar-item">
          <div
            className="trend-bar-fill"
            style={{ height: `${getBarHeight(item.amount, maxAmount)}%` }}
          />
          <span className="trend-bar-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function MetricCard({ label, value, accent }) {
  return (
    <div className="detail-metric">
      <span className="detail-metric-label">{label}</span>
      <span className={`detail-metric-value ${accent || ''}`}>{value}</span>
    </div>
  );
}

export default function Statistics({ records }) {
  const [periodDays, setPeriodDays] = useState(7);
  const [selectedCategory, setSelectedCategory] = useState('');

  const viewModel = useMemo(
    () => getStatisticsViewModel(records, periodDays),
    [records, periodDays]
  );

  const activeCategory = viewModel.categories.some(
    (item) => item.category === selectedCategory
  )
    ? selectedCategory
    : (viewModel.categories[0]?.category || '');

  const selectedDetail = viewModel.categories.find(
    (item) => item.category === activeCategory
  ) || viewModel.categories[0];

  if (!viewModel.categories.length) {
    return (
      <div className="statistics">
        <div className="stats-shell">
          <div className="stats-periods">
            {PERIOD_OPTIONS.map((days) => (
              <button
                key={days}
                className={`stats-period-btn ${periodDays === days ? 'active' : ''}`}
                onClick={() => setPeriodDays(days)}
              >
                近{days}天
              </button>
            ))}
          </div>
          <div className="stats-empty">
            <h3>当前周期暂无支出记录</h3>
            <p>先记几笔支出后，这里会开始展示分类趋势。</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="statistics">
      <section className="stats-shell">
        <div className="stats-periods">
          {PERIOD_OPTIONS.map((days) => (
            <button
              key={days}
              className={`stats-period-btn ${periodDays === days ? 'active' : ''}`}
              onClick={() => setPeriodDays(days)}
            >
              近{days}天
            </button>
          ))}
        </div>

        <div className="stats-summary">
          <span className="stats-summary-kicker">{viewModel.summary.title}</span>
          <strong className="stats-summary-amount">
            {formatAmount(viewModel.totalAmount)}
          </strong>
          <p className="stats-summary-text">{viewModel.summary.description}</p>
        </div>
      </section>

      <section className="stats-section">
        <div className="stats-section-head">
          <h3 className="stats-section-title">分类趋势总览</h3>
          <span className="stats-section-meta">按当前周期支出排序</span>
        </div>
        <div className="trend-card-list">
          {viewModel.categories.map((item) => (
            <button
              key={item.category}
              className={`trend-card ${activeCategory === item.category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(item.category)}
            >
              <div className="trend-card-top">
                <div>
                  <span className="trend-card-name">{item.category}</span>
                  <span className={`trend-chip ${item.trend}`}>{item.trendText}</span>
                </div>
                <strong className="trend-card-amount">{formatAmount(item.currentAmount)}</strong>
              </div>
              <div className="trend-card-change">
                <span>较上一周期 {item.deltaAmount >= 0 ? '+' : ''}{formatAmount(item.deltaAmount)}</span>
                {item.percentText && <span>{item.percentText}</span>}
              </div>
              <TrendBars series={item.miniSeries} compact={true} />
            </button>
          ))}
        </div>
      </section>

      {selectedDetail && (
        <section className="stats-section">
          <div className="stats-section-head">
            <div>
              <h3 className="stats-section-title">{selectedDetail.category} 明细</h3>
              <span className="stats-section-meta">按天和按周查看变化</span>
            </div>
          </div>

          <div className="detail-metrics">
            <MetricCard label="当前周期总支出" value={formatAmount(selectedDetail.currentAmount)} accent="expense" />
            <MetricCard label="上一周期" value={formatAmount(selectedDetail.previousAmount)} />
            <MetricCard label="日均支出" value={formatAmount(selectedDetail.averageAmount)} />
            <MetricCard
              label="峰值日"
              value={selectedDetail.peakDay ? `${selectedDetail.peakDay.label} ${formatAmount(selectedDetail.peakDay.amount)}` : '--'}
            />
          </div>

          <div className="detail-block">
            <div className="detail-block-head">
              <h4>按天趋势</h4>
              <span>近{periodDays}天</span>
            </div>
            <TrendBars series={selectedDetail.dailySeries} />
          </div>

          <div className="detail-block">
            <div className="detail-block-head">
              <h4>按周趋势</h4>
              <span>自然周聚合</span>
            </div>
            <TrendBars series={selectedDetail.weeklySeries} />
          </div>

          <div className="detail-block">
            <div className="detail-block-head">
              <h4>最近记录</h4>
              <span>帮助对应真实消费</span>
            </div>
            <div className="detail-records">
              {selectedDetail.recentRecords.map((record) => (
                <div key={record.id} className="detail-record">
                  <div className="detail-record-main">
                    <span className="detail-record-note">{record.note || selectedDetail.category}</span>
                    <span className="detail-record-time">{formatDate(record.datetime)}</span>
                  </div>
                  <strong className="detail-record-amount">{formatAmount(record.amount)}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
