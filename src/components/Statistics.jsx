import { useMemo, useState } from 'react';
import { formatAmount, formatDate } from '../utils/format';
import { getStatisticsViewModel } from '../utils/statistics';
import './Statistics.css';

const PERIOD_OPTIONS = [
  { value: 7, label: '近7天' },
  { value: 30, label: '近30天' },
];

function buildCurvePath(points) {
  if (!points.length) {
    return '';
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const controlX = (current.x + next.x) / 2;
    path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }
  return path;
}

function getChartGeometry(series, width, height, compact = false) {
  const padding = compact
    ? { top: 6, right: 6, bottom: 6, left: 6 }
    : { top: 12, right: 8, bottom: 20, left: 8 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const maxAmount = Math.max(...series.map((item) => item.amount), 0);
  const safeMax = maxAmount > 0 ? maxAmount : 1;

  const points = series.map((item, index) => {
    const x = series.length === 1
      ? padding.left + innerWidth / 2
      : padding.left + (innerWidth * index) / (series.length - 1);
    const y = padding.top + innerHeight - (item.amount / safeMax) * innerHeight;
    return { ...item, x, y };
  });

  const baseY = padding.top + innerHeight;
  return { padding, innerWidth, innerHeight, baseY, points };
}

function CurveChart({
  series,
  compact = false,
  interactive = false,
  selectedKey = '',
  onSelect,
}) {
  const width = compact ? 160 : 320;
  const height = compact ? 58 : 176;
  const { padding, innerWidth, innerHeight, baseY, points } = getChartGeometry(series, width, height, compact);
  const linePath = buildCurvePath(points);
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${baseY} L ${points[0].x} ${baseY} Z`
    : '';
  const peakPoint = points.reduce((peak, point) => {
    if (!peak || point.amount > peak.amount) {
      return point;
    }
    return peak;
  }, null);
  const lastPoint = points[points.length - 1] || null;
  const selectedPoint = interactive
    ? points.find((point) => point.key === selectedKey) || null
    : null;
  const tickIndices = compact
    ? []
    : Array.from(new Set([0, Math.floor((series.length - 1) / 2), series.length - 1]))
      .filter((index) => index >= 0);

  return (
    <div className={`curve-chart ${compact ? 'compact' : ''}`}>
      <svg viewBox={`0 0 ${width} ${height}`} className="curve-chart-svg" preserveAspectRatio="none">
        {!compact && [0, 1, 2].map((level) => {
          const y = padding.top + (innerHeight * level) / 2;
          return (
            <line
              key={level}
              x1={padding.left}
              x2={padding.left + innerWidth}
              y1={y}
              y2={y}
              className="curve-grid-line"
            />
          );
        })}

        {areaPath && <path d={areaPath} className="curve-area" />}
        {linePath && <path d={linePath} className="curve-line" />}

        {selectedPoint && (
          <line
            x1={selectedPoint.x}
            x2={selectedPoint.x}
            y1={padding.top}
            y2={baseY}
            className="curve-focus-line"
          />
        )}

        {peakPoint && (
          <circle
            cx={peakPoint.x}
            cy={peakPoint.y}
            r={compact ? 1.7 : 2.8}
            className="curve-point peak"
          />
        )}

        {lastPoint && (
          <>
            <circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r={compact ? 2.1 : 3.4}
              className="curve-point last-halo"
            />
            <circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r={compact ? 1.9 : 2.8}
              className="curve-point last"
            />
          </>
        )}

        {selectedPoint && (
          <>
            <circle
              cx={selectedPoint.x}
              cy={selectedPoint.y}
              r={7}
              className="curve-point selected-halo"
            />
            <circle
              cx={selectedPoint.x}
              cy={selectedPoint.y}
              r={3.6}
              className="curve-point selected"
            />
          </>
        )}

        {interactive && points.map((point) => (
          <circle
            key={`${point.key}-hit`}
            cx={point.x}
            cy={point.y}
            r={12}
            className="curve-hit-area"
            onClick={() => onSelect?.(point.key)}
          />
        ))}

        {!compact && tickIndices.map((index) => {
          const point = points[index];
          return (
            <text
              key={point.key}
              x={point.x}
              y={height - 6}
              textAnchor={index === 0 ? 'start' : index === series.length - 1 ? 'end' : 'middle'}
              className="curve-axis-label"
            >
              {point.label}
            </text>
          );
        })}
      </svg>
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

function getChangeAccent(trend) {
  if (trend === 'up' || trend === 'new') {
    return 'expense';
  }
  if (trend === 'down') {
    return 'income';
  }
  return '';
}

export default function Statistics({ records }) {
  const [periodDays, setPeriodDays] = useState(7);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDailyKey, setSelectedDailyKey] = useState('');
  const [selectedWeeklyKey, setSelectedWeeklyKey] = useState('');

  const viewModel = useMemo(
    () => getStatisticsViewModel(records, periodDays),
    [records, periodDays]
  );

  const activeCategory = viewModel.categories.some((item) => item.category === selectedCategory)
    ? selectedCategory
    : (viewModel.categories[0]?.category || '');

  const selectedDetail = viewModel.categories.find((item) => item.category === activeCategory)
    || viewModel.categories[0];
  const selectedDailyPoint = selectedDetail?.dailySeries.find((item) => item.key === selectedDailyKey) || null;
  const selectedWeeklyPoint = selectedDetail?.weeklySeries.find((item) => item.key === selectedWeeklyKey) || null;

  const handlePeriodChange = (nextPeriodDays) => {
    setPeriodDays(nextPeriodDays);
    setSelectedDailyKey('');
    setSelectedWeeklyKey('');
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSelectedDailyKey('');
    setSelectedWeeklyKey('');
  };

  if (!viewModel.categories.length) {
    return (
      <div className="statistics">
        <div className="stats-shell">
          <div className="stats-periods">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={`stats-period-btn ${periodDays === option.value ? 'active' : ''}`}
                onClick={() => handlePeriodChange(option.value)}
              >
                {option.label}
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
      <section className="stats-shell stats-hero">
        <div className="stats-periods">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`stats-period-btn ${periodDays === option.value ? 'active' : ''}`}
              onClick={() => handlePeriodChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="stats-summary">
          <span className="stats-summary-kicker">{viewModel.summary.title}</span>
          <strong className="stats-summary-amount">{formatAmount(viewModel.totalAmount)}</strong>
          <p className="stats-summary-text">{viewModel.summary.description}</p>
          {viewModel.summary.secondary && (
            <p className="stats-summary-subtext">{viewModel.summary.secondary}</p>
          )}
        </div>
      </section>

      <section className="stats-section stats-board">
        <div className="stats-board-section">
          <div className="stats-section-head">
            <h3 className="stats-section-title">分类趋势总览</h3>
          </div>

          <div className="trend-card-list">
            {viewModel.categories.map((item, index) => (
              <button
                key={item.category}
                className={`trend-card ${activeCategory === item.category ? 'active' : ''}`}
                onClick={() => handleCategoryChange(item.category)}
              >
                <div className="trend-card-copy">
                  <div className="trend-card-top">
                    <div>
                      <span className="trend-card-name">{item.category}</span>
                      <div className="trend-card-headline">
                        <span className={`trend-chip ${item.trend}`}>{item.trendText}</span>
                        {item.percentText && (
                    <strong className={`trend-card-rate ${getChangeAccent(item.trend)}`}>
                          {item.percentText}
                        </strong>
                      )}
                    </div>
                  </div>
                  <strong className="trend-card-amount">{formatAmount(item.currentAmount)}</strong>
                </div>

                <div className="trend-card-change">
                  <span>{item.comparisonText}</span>
                  <span className="trend-card-share">#{index + 1}</span>
                </div>
              </div>

                <CurveChart series={item.miniSeries} compact={true} />
              </button>
            ))}
          </div>
        </div>

        {selectedDetail && (
          <>
            <div className="stats-board-divider" />

            <div className="stats-board-section">
              <div className="stats-section-head">
                <div>
                  <h3 className="stats-section-title">{selectedDetail.category} 明细</h3>
                </div>
              </div>

              <div className="detail-metrics">
                <MetricCard label="当前周期总支出" value={formatAmount(selectedDetail.currentAmount)} accent="expense" />
                <MetricCard label="占比" value={selectedDetail.shareText} />
                <MetricCard
                  label="变化幅度"
                  value={selectedDetail.percentText || selectedDetail.trendText}
                  accent={getChangeAccent(selectedDetail.trend)}
                />
              </div>

              <div className="detail-grid">
                <div className="detail-block chart-surface">
                  <div className="detail-block-head">
                    <h4>按天趋势</h4>
                    <span>{selectedDailyPoint ? `${selectedDailyPoint.label} · ${formatAmount(selectedDailyPoint.amount)}` : `近${periodDays}天`}</span>
                  </div>
                  <CurveChart
                    series={selectedDetail.dailySeries}
                    interactive={true}
                    selectedKey={selectedDailyKey}
                    onSelect={setSelectedDailyKey}
                  />
                  {selectedDailyPoint && (
                    <div className="chart-readout">
                      <div className="chart-readout-main">
                        <strong>{selectedDailyPoint.label}</strong>
                        <span>{formatAmount(selectedDailyPoint.amount)}</span>
                      </div>
                      <span className="chart-readout-meta">
                        {selectedDetail.peakPoint?.key === selectedDailyPoint.key ? '峰值点' : '单日读值'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="detail-block chart-surface">
                  <div className="detail-block-head">
                    <h4>按周趋势</h4>
                    <span>{selectedWeeklyPoint ? `${selectedWeeklyPoint.label} · ${formatAmount(selectedWeeklyPoint.amount)}` : '自然周聚合'}</span>
                  </div>
                  <CurveChart
                    series={selectedDetail.weeklySeries}
                    interactive={true}
                    selectedKey={selectedWeeklyKey}
                    onSelect={setSelectedWeeklyKey}
                  />
                  {selectedWeeklyPoint && (
                    <div className="chart-readout">
                      <div className="chart-readout-main">
                        <strong>{selectedWeeklyPoint.label}</strong>
                        <span>{formatAmount(selectedWeeklyPoint.amount)}</span>
                      </div>
                      <span className="chart-readout-meta">周聚合读值</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-block detail-record-panel">
                <div className="detail-block-head">
                  <h4>最近记录</h4>
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
            </div>
          </>
        )}
      </section>
    </div>
  );
}
