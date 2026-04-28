const DAY_MS = 24 * 60 * 60 * 1000;
const TOP_CATEGORY_LIMIT = 5;
const FLAT_DELTA_THRESHOLD = 0.01;

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date, amount) {
  return new Date(startOfDay(date).getTime() + amount * DAY_MS);
}

function isValidDate(date) {
  return Number.isFinite(date.getTime());
}

function parseRecordDate(record) {
  const date = new Date(record.datetime);
  return isValidDate(date) ? date : null;
}

function formatDayLabel(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}`;
}

function formatWeekLabel(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}`;
}

function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return null;
  }
  return `${value > 0 ? '+' : ''}${value.toFixed(0)}%`;
}

function formatSignedAmount(amount) {
  return `${amount >= 0 ? '+' : ''}${amount.toFixed(2)}`;
}

function getPeriodRange(days, now = new Date()) {
  const end = startOfDay(now);
  const start = addDays(end, -(days - 1));
  return {
    start,
    end,
    endExclusive: addDays(end, 1),
  };
}

function getPreviousPeriodRange(days, now = new Date()) {
  const current = getPeriodRange(days, now);
  const end = addDays(current.start, -1);
  const start = addDays(end, -(days - 1));
  return {
    start,
    end,
    endExclusive: addDays(end, 1),
  };
}

function isDateInRange(date, range) {
  return date >= range.start && date < range.endExclusive;
}

function getExpenseRecords(records) {
  return records.filter((record) => {
    if (record?.type !== 'expense' || !record?.category || !record?.datetime) {
      return false;
    }

    const amount = Number(record.amount);
    if (!Number.isFinite(amount)) {
      return false;
    }

    return !!parseRecordDate(record);
  });
}

function sumAmounts(records) {
  return records.reduce((sum, record) => sum + Number(record.amount), 0);
}

function sumByCategory(records) {
  return records.reduce((map, record) => {
    map[record.category] = (map[record.category] || 0) + Number(record.amount);
    return map;
  }, {});
}

function getTrendKey(currentAmount, previousAmount) {
  if (previousAmount === 0 && currentAmount > 0) {
    return 'new';
  }

  const delta = currentAmount - previousAmount;
  if (Math.abs(delta) < FLAT_DELTA_THRESHOLD) {
    return 'flat';
  }

  return delta > 0 ? 'up' : 'down';
}

function getTrendMeta(currentAmount, previousAmount) {
  const deltaAmount = currentAmount - previousAmount;
  const trend = getTrendKey(currentAmount, previousAmount);

  if (trend === 'new') {
    return {
      trend,
      trendText: '新出现',
      percentText: null,
      percentValue: null,
      deltaAmount,
    };
  }

  if (trend === 'flat') {
    return {
      trend,
      trendText: '基本持平',
      percentText: null,
      percentValue: 0,
      deltaAmount,
    };
  }

  const percent = previousAmount > 0 ? (deltaAmount / previousAmount) * 100 : null;
  return {
    trend,
    trendText: trend === 'up' ? '上升' : '下降',
    percentText: formatPercent(percent),
    percentValue: percent,
    deltaAmount,
  };
}

function getSignificanceScore(currentAmount, previousAmount, totalAmount) {
  const deltaAmount = Math.abs(currentAmount - previousAmount);
  const shareWeight = totalAmount > 0 ? currentAmount / totalAmount : 0;
  return deltaAmount + currentAmount * 0.35 + shareWeight * 100;
}

function getWeekStart(date) {
  const base = startOfDay(date);
  const day = base.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  return addDays(base, offset);
}

function buildDailySeries(records, category, days, now = new Date()) {
  const range = getPeriodRange(days, now);
  const buckets = new Map();

  records.forEach((record) => {
    if (record.category !== category) {
      return;
    }
    const date = parseRecordDate(record);
    if (!date || !isDateInRange(date, range)) {
      return;
    }
    const key = startOfDay(date).toISOString();
    buckets.set(key, (buckets.get(key) || 0) + Number(record.amount));
  });

  return Array.from({ length: days }, (_, index) => {
    const date = addDays(range.start, index);
    const key = date.toISOString();
    return {
      key,
      label: formatDayLabel(date),
      amount: buckets.get(key) || 0,
    };
  });
}

function buildWeeklySeries(records, category, days, now = new Date()) {
  const range = getPeriodRange(days, now);
  const firstWeekStart = getWeekStart(range.start);
  const lastWeekStart = getWeekStart(range.end);
  const buckets = new Map();

  records.forEach((record) => {
    if (record.category !== category) {
      return;
    }
    const date = parseRecordDate(record);
    if (!date || !isDateInRange(date, range)) {
      return;
    }
    const key = getWeekStart(date).toISOString();
    buckets.set(key, (buckets.get(key) || 0) + Number(record.amount));
  });

  const series = [];
  for (let cursor = firstWeekStart; cursor <= lastWeekStart; cursor = addDays(cursor, 7)) {
    const key = cursor.toISOString();
    series.push({
      key,
      label: formatWeekLabel(cursor),
      amount: buckets.get(key) || 0,
    });
  }
  return series;
}

function getPeakPoint(series) {
  return series.reduce((peak, item) => {
    if (!peak || item.amount > peak.amount) {
      return item;
    }
    return peak;
  }, null);
}

function buildOverviewCategories(currentMap, previousMap, expenseRecords, days, now, totalAmount) {
  const currentRange = getPeriodRange(days, now);

  return Object.entries(currentMap)
    .map(([category, currentAmount]) => {
      const previousAmount = previousMap[category] || 0;
      const trendMeta = getTrendMeta(currentAmount, previousAmount);
      const dailySeries = buildDailySeries(expenseRecords, category, days, now);
      const weeklySeries = buildWeeklySeries(expenseRecords, category, days, now);
      const recentRecords = expenseRecords
        .filter((record) => {
          const date = parseRecordDate(record);
          return record.category === category && date && isDateInRange(date, currentRange);
        })
        .sort((left, right) => new Date(right.datetime) - new Date(left.datetime))
        .slice(0, 5);
      const peakPoint = getPeakPoint(dailySeries);
      const sharePercent = totalAmount > 0 ? (currentAmount / totalAmount) * 100 : 0;
      const significanceScore = getSignificanceScore(currentAmount, previousAmount, totalAmount);

      return {
        category,
        currentAmount,
        previousAmount,
        deltaAmount: trendMeta.deltaAmount,
        trend: trendMeta.trend,
        trendText: trendMeta.trendText,
        percentText: trendMeta.percentText,
        percentValue: trendMeta.percentValue,
        sharePercent,
        shareText: `${sharePercent.toFixed(0)}%`,
        significanceScore,
        miniSeries: dailySeries,
        dailySeries,
        weeklySeries,
        recentRecords,
        averageAmount: currentAmount / days,
        peakPoint,
        lastPoint: dailySeries[dailySeries.length - 1] || null,
        comparisonText: trendMeta.trend === 'new'
          ? `本期新出现，占总支出 ${sharePercent.toFixed(0)}%`
          : `${formatSignedAmount(trendMeta.deltaAmount)}，占总支出 ${sharePercent.toFixed(0)}%`,
      };
    })
    .sort((left, right) => right.significanceScore - left.significanceScore)
    .slice(0, TOP_CATEGORY_LIMIT);
}

function buildSummary(categories, days) {
  if (!categories.length) {
    return {
      title: `近${days}天暂无分类趋势`,
      description: '当前周期还没有支出记录。',
      secondary: '',
    };
  }

  const rising = categories
    .filter((item) => item.trend === 'up' || item.trend === 'new')
    .sort((left, right) => right.deltaAmount - left.deltaAmount)[0];

  const falling = categories
    .filter((item) => item.trend === 'down')
    .sort((left, right) => left.deltaAmount - right.deltaAmount)[0];

  const title = `近${days}天分类趋势`;

  if (rising) {
    return {
      title,
      description: `${rising.category}${rising.trend === 'new' ? '是新出现支出' : '增长最快'}，${formatSignedAmount(rising.deltaAmount)}，占总支出 ${rising.shareText}`,
      secondary: falling
        ? `${falling.category}回落最多，${formatSignedAmount(falling.deltaAmount)}`
        : `${categories[0].category}当前仍是最值得优先关注的分类`,
    };
  }

  if (falling) {
    return {
      title,
      description: `${falling.category}回落最多，${formatSignedAmount(falling.deltaAmount)}，当前占总支出 ${falling.shareText}`,
      secondary: `${categories[0].category}仍是当前变化强度最高的分类`,
    };
  }

  const strongest = categories[0];
  return {
    title,
    description: `${strongest.category}变化最明显，当前支出 ${strongest.currentAmount.toFixed(2)}，占总支出 ${strongest.shareText}`,
    secondary: '当前主要分类整体比较平稳，没有明显上升或回落。',
  };
}

export function getStatisticsViewModel(records, periodDays, now = new Date()) {
  const expenseRecords = getExpenseRecords(records);
  const currentRange = getPeriodRange(periodDays, now);
  const previousRange = getPreviousPeriodRange(periodDays, now);

  const currentRecords = expenseRecords.filter((record) => {
    const date = parseRecordDate(record);
    return date && isDateInRange(date, currentRange);
  });

  const previousRecords = expenseRecords.filter((record) => {
    const date = parseRecordDate(record);
    return date && isDateInRange(date, previousRange);
  });

  const currentMap = sumByCategory(currentRecords);
  const previousMap = sumByCategory(previousRecords);
  const totalAmount = sumAmounts(currentRecords);
  const categories = buildOverviewCategories(
    currentMap,
    previousMap,
    expenseRecords,
    periodDays,
    now,
    totalAmount
  );

  return {
    periodDays,
    totalAmount,
    categories,
    summary: buildSummary(categories, periodDays),
  };
}
