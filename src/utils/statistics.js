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
  return `${month}/${day}周`;
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return null;
  return `${value > 0 ? '+' : ''}${value.toFixed(0)}%`;
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
      deltaAmount,
    };
  }

  if (trend === 'flat') {
    return {
      trend,
      trendText: '基本持平',
      percentText: null,
      deltaAmount,
    };
  }

  const percent = previousAmount > 0 ? (deltaAmount / previousAmount) * 100 : null;
  return {
    trend,
    trendText: trend === 'up' ? '上升' : '下降',
    percentText: formatPercent(percent),
    deltaAmount,
  };
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

function getPeakDay(series) {
  return series.reduce((peak, item) => {
    if (!peak || item.amount > peak.amount) {
      return item;
    }
    return peak;
  }, null);
}

function buildOverviewCategories(currentMap, previousMap, expenseRecords, days, now) {
  return Object.entries(currentMap)
    .map(([category, currentAmount]) => {
      const previousAmount = previousMap[category] || 0;
      const trendMeta = getTrendMeta(currentAmount, previousAmount);
      const dailySeries = buildDailySeries(expenseRecords, category, days, now);
      const weeklySeries = buildWeeklySeries(expenseRecords, category, days, now);
      const recentRecords = expenseRecords
        .filter((record) => {
          const date = parseRecordDate(record);
          return record.category === category && date && isDateInRange(date, getPeriodRange(days, now));
        })
        .sort((a, b) => new Date(b.datetime) - new Date(a.datetime))
        .slice(0, 5);
      const peakDay = getPeakDay(dailySeries);

      return {
        category,
        currentAmount,
        previousAmount,
        deltaAmount: trendMeta.deltaAmount,
        trend: trendMeta.trend,
        trendText: trendMeta.trendText,
        percentText: trendMeta.percentText,
        miniSeries: dailySeries.slice(-7),
        dailySeries,
        weeklySeries,
        recentRecords,
        averageAmount: currentAmount / days,
        peakDay,
      };
    })
    .sort((a, b) => b.currentAmount - a.currentAmount)
    .slice(0, TOP_CATEGORY_LIMIT);
}

function buildSummary(categories, days) {
  if (!categories.length) {
    return {
      title: `近${days}天暂无分类趋势`,
      description: '当前周期还没有支出记录。',
    };
  }

  const rising = categories
    .filter((item) => item.trend === 'up' || item.trend === 'new')
    .sort((a, b) => b.deltaAmount - a.deltaAmount)[0];

  if (rising) {
    return {
      title: `近${days}天分类趋势`,
      description: `${rising.category}${rising.trend === 'new' ? '是新出现支出' : '增长最快'}，当前支出 ${rising.currentAmount.toFixed(2)}`,
    };
  }

  const highest = categories[0];
  return {
    title: `近${days}天分类趋势`,
    description: `${highest.category}仍是当前周期支出最高分类，金额 ${highest.currentAmount.toFixed(2)}`,
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
  const categories = buildOverviewCategories(currentMap, previousMap, expenseRecords, periodDays, now);
  const totalAmount = sumAmounts(currentRecords);

  return {
    periodDays,
    totalAmount,
    categories,
    summary: buildSummary(categories, periodDays),
  };
}
