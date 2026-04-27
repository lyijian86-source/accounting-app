import { formatFullDate } from './format';

export function exportCSV(records) {
  const header = '金额,类型,分类,标签,备注,时间';
  const rows = records.map(r => {
    const tags = r.tags.join(';');
    const note = (r.note || '').replace(/,/g, '，');
    const type = r.type === 'expense' ? '支出' : '收入';
    return `${r.amount},${type},${r.category},${tags},${note},${formatFullDate(r.datetime)}`;
  });
  const csv = '﻿' + header + '\n' + rows.join('\n');
  downloadFile(csv, '记账数据.csv', 'text/csv;charset=utf-8');
}

export function exportJSON(records) {
  const data = records.map(r => ({
    amount: r.amount,
    type: r.type === 'expense' ? '支出' : '收入',
    category: r.category,
    tags: r.tags,
    note: r.note || '',
    datetime: formatFullDate(r.datetime),
  }));
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, '记账数据.json', 'application/json;charset=utf-8');
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
