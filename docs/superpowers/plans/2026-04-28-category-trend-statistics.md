# Category Trend Statistics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the statistics tab into a mobile-friendly expense category trend dashboard with 7-day and 30-day views, category overview cards, and per-category day/week detail.

**Architecture:** Keep the record storage model unchanged and move trend aggregation into a dedicated utility module. The `Statistics` view becomes a thin stateful container that consumes precomputed trend data and renders overview and detail sections with scoped CSS.

**Tech Stack:** React 19, Vite 8, plain CSS, existing localStorage record model

---

## File Map

- Create: `src/utils/statistics.js`
  - Pure functions for filtering expense records, period comparison, daily/weekly aggregation, summary text, and selected-category detail.
- Modify: `src/components/Statistics.jsx`
  - Replace current monthly summary view with period toggle, overview cards, and detail sections.
- Modify: `src/components/Statistics.css`
  - Add mobile-first layout, card states, summary chips, mini trend bars, and detail chart styles.

### Task 1: Build trend aggregation utilities

**Files:**
- Create: `src/utils/statistics.js`
- Test: manual validation via `npm run build`

- [ ] **Step 1: Add date helpers and period boundaries**

```js
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date, amount) {
  return new Date(startOfDay(date).getTime() + amount * DAY_MS);
}

function getPeriodRange(days, now = new Date()) {
  const end = startOfDay(now);
  const start = addDays(end, -(days - 1));
  return { start, end };
}
```

- [ ] **Step 2: Add record filtering and category aggregation**

```js
function getExpenseRecords(records) {
  return records.filter((record) =>
    record?.type === 'expense'
    && record?.category
    && Number.isFinite(Number(record?.amount))
    && record?.datetime
  );
}

function sumByCategory(records) {
  return records.reduce((map, record) => {
    map[record.category] = (map[record.category] || 0) + Number(record.amount);
    return map;
  }, {});
}
```

- [ ] **Step 3: Add overview-card builders and trend labels**

```js
function getTrendLabel(currentAmount, previousAmount) {
  if (previousAmount === 0 && currentAmount > 0) return 'new';
  const delta = currentAmount - previousAmount;
  if (Math.abs(delta) < 0.01) return 'flat';
  return delta > 0 ? 'up' : 'down';
}

function buildCategoryOverview(currentMap, previousMap, topLimit) {
  return Object.entries(currentMap)
    .map(([category, currentAmount]) => {
      const previousAmount = previousMap[category] || 0;
      const deltaAmount = currentAmount - previousAmount;
      return {
        category,
        currentAmount,
        previousAmount,
        deltaAmount,
        trend: getTrendLabel(currentAmount, previousAmount),
      };
    })
    .sort((a, b) => b.currentAmount - a.currentAmount)
    .slice(0, topLimit);
}
```

- [ ] **Step 4: Add daily and weekly series builders**

```js
function buildDailySeries(records, category, days, now = new Date()) {
  // returns [{ key, label, amount }]
}

function buildWeeklySeries(records, category, days, now = new Date()) {
  // returns [{ key, label, amount }]
}
```

- [ ] **Step 5: Export one high-level API for the page**

```js
export function getStatisticsViewModel(records, periodDays, now = new Date()) {
  return {
    periodDays,
    summary,
    categories,
    selectedCategory,
    detailByCategory,
  };
}
```

- [ ] **Step 6: Verify utility module builds**

Run: `npm run build`
Expected: `vite build` completes successfully

### Task 2: Rebuild the statistics page around the view model

**Files:**
- Modify: `src/components/Statistics.jsx`
- Test: manual validation via `npm run build`

- [ ] **Step 1: Add page state for current period and selected category**

```jsx
const [periodDays, setPeriodDays] = useState(7);
const [selectedCategory, setSelectedCategory] = useState('');
```

- [ ] **Step 2: Replace inline monthly math with memoized view-model consumption**

```jsx
const viewModel = useMemo(
  () => getStatisticsViewModel(records, periodDays),
  [records, periodDays]
);
```

- [ ] **Step 3: Keep selected category stable across period changes**

```jsx
useEffect(() => {
  if (!viewModel.categories.length) {
    setSelectedCategory('');
    return;
  }
  const exists = viewModel.categories.some((item) => item.category === selectedCategory);
  if (!exists) {
    setSelectedCategory(viewModel.categories[0].category);
  }
}, [selectedCategory, viewModel.categories]);
```

- [ ] **Step 4: Render summary and period toggle**

```jsx
<div className="stats-periods">
  {[7, 30].map((days) => (
    <button
      key={days}
      className={`stats-period-btn ${periodDays === days ? 'active' : ''}`}
      onClick={() => setPeriodDays(days)}
    >
      近{days}天
    </button>
  ))}
</div>
```

- [ ] **Step 5: Render selectable category overview cards and detail section**

```jsx
{viewModel.categories.map((item) => (
  <button
    key={item.category}
    className={`trend-card ${selectedCategory === item.category ? 'active' : ''}`}
    onClick={() => setSelectedCategory(item.category)}
  >
    ...
  </button>
))}
```

- [ ] **Step 6: Render empty state when there are no expense categories**

```jsx
if (!viewModel.categories.length) {
  return <div className="statistics-empty">当前周期暂无支出记录</div>;
}
```

- [ ] **Step 7: Verify the page builds**

Run: `npm run build`
Expected: `vite build` completes successfully

### Task 3: Add mobile-first styling for overview and detail

**Files:**
- Modify: `src/components/Statistics.css`
- Test: manual validation via `npm run build`

- [ ] **Step 1: Replace the old statistics layout with stacked sections**

```css
.statistics {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
```

- [ ] **Step 2: Add period toggle, summary panel, and trend-card styles**

```css
.stats-periods { ... }
.stats-period-btn { ... }
.trend-card { ... }
.trend-card.active { ... }
```

- [ ] **Step 3: Add mini bar and detail chart styles**

```css
.trend-mini-bars { ... }
.detail-chart { ... }
.detail-bar { ... }
```

- [ ] **Step 4: Add responsive guards for narrow screens**

```css
.detail-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
```

- [ ] **Step 5: Verify the page builds**

Run: `npm run build`
Expected: `vite build` completes successfully

### Task 4: End-to-end validation

**Files:**
- Modify: `src/components/Statistics.jsx`
- Modify: `src/components/Statistics.css`
- Create: `src/utils/statistics.js`

- [ ] **Step 1: Run production build**

Run: `npm run build`
Expected: build output generated under `dist/`

- [ ] **Step 2: Manual validation checklist**

Run the app and verify:

```text
1. 统计页默认展示近7天，且自动选中最高支出分类
2. 点击“近30天”后，总览和明细同步变化
3. 点击不同分类卡片后，按天/按周/最近记录联动更新
4. 无支出记录时显示空状态
5. 手机上没有横向滚动
```

- [ ] **Step 3: Commit**

```bash
git add src/utils/statistics.js src/components/Statistics.jsx src/components/Statistics.css docs/superpowers/plans/2026-04-28-category-trend-statistics.md
git commit -m "feat: add category trend statistics"
```
