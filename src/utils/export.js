import { formatFullDate } from './format';
import { buildBackupPayload } from './backup';

export function exportCSV(records) {
  const header = '金额,类型,分类,标签,备注,时间';
  const rows = records.map((record) => {
    const tags = Array.isArray(record.tags) ? record.tags.join(';') : '';
    const note = (record.note || '').replace(/,/g, '，');
    const type = record.type === 'expense' ? '支出' : '收入';
    return `${record.amount},${type},${record.category},${tags},${note},${formatFullDate(record.datetime)}`;
  });

  const csv = '\uFEFF' + header + '\n' + rows.join('\n');
  downloadFile(csv, '记账数据.csv', 'text/csv;charset=utf-8');
}

export function exportJSON(records) {
  const data = records.map((record) => ({
    amount: record.amount,
    type: record.type === 'expense' ? '支出' : '收入',
    category: record.category,
    tags: record.tags,
    note: record.note || '',
    datetime: formatFullDate(record.datetime),
  }));

  const json = JSON.stringify(data, null, 2);
  downloadFile(json, '记账数据.json', 'application/json;charset=utf-8');
}

export function exportBackupJSON(data) {
  const backup = buildBackupPayload(data);
  const json = JSON.stringify(backup, null, 2);
  downloadFile(json, `accounting-backup-${Date.now()}.json`, 'application/json;charset=utf-8');
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
