const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
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

function getPeriodRange(days, now = new Date()) {
  const end = startOfDay(now);
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

function isExpenseRecord(record) {
  if (record?.type !== 'expense' || !record?.datetime || !record?.category) {
    return false;
  }

  const amount = Number(record.amount);
  if (!Number.isFinite(amount)) {
    return false;
  }

  return !!parseRecordDate(record);
}

function matchesCategory(record, selectedCategory) {
  if (selectedCategory === 'all') {
    return true;
  }

  return record.category === selectedCategory;
}

function matchesTag(record, selectedTag) {
  if (selectedTag === 'all') {
    return true;
  }

  return Array.isArray(record.tags) && record.tags.includes(selectedTag);
}

function formatFilterLabel(periodDays, selectedCategory, selectedTag) {
  const periodLabel = periodDays === 7 ? '近七日' : '近三十天';
  const categoryLabel = selectedCategory === 'all' ? '全部分类' : selectedCategory;
  const tagLabel = selectedTag === 'all' ? '全部标签' : selectedTag;
  return `${periodLabel} · ${categoryLabel} · ${tagLabel}`;
}

export function getStatisticsViewModel(
  records,
  periodDays,
  selectedCategory = 'all',
  selectedTag = 'all',
  now = new Date()
) {
  const range = getPeriodRange(periodDays, now);

  const filteredRecords = records
    .filter(isExpenseRecord)
    .filter((record) => {
      const date = parseRecordDate(record);
      return date
        && isDateInRange(date, range)
        && matchesCategory(record, selectedCategory)
        && matchesTag(record, selectedTag);
    })
    .sort((left, right) => new Date(right.datetime) - new Date(left.datetime));

  const dailyBuckets = new Map();
  filteredRecords.forEach((record) => {
    const key = startOfDay(new Date(record.datetime)).toISOString();
    dailyBuckets.set(key, (dailyBuckets.get(key) || 0) + Number(record.amount));
  });

  const series = Array.from({ length: periodDays }, (_, index) => {
    const date = addDays(range.start, index);
    const key = date.toISOString();
    return {
      key,
      label: formatDayLabel(date),
      amount: dailyBuckets.get(key) || 0,
    };
  });

  const totalAmount = filteredRecords.reduce((sum, record) => sum + Number(record.amount), 0);

  return {
    periodDays,
    selectedCategory,
    selectedTag,
    filterLabel: formatFilterLabel(periodDays, selectedCategory, selectedTag),
    totalAmount,
    hasRecords: filteredRecords.length > 0,
    series,
    recentRecords: filteredRecords.slice(0, 8),
  };
}
