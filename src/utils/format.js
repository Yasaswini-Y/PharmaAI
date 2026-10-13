export const shortId = (value) => value ? `${value.slice(0, 8)}...` : '—';
export const formatDate = (value) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
export const formatBytes = (value) => { if (!Number.isFinite(value)) return '—'; if (value < 1024) return `${value} B`; const units = ['KB', 'MB', 'GB']; let size = value / 1024; let index = 0; while (size >= 1024 && index < units.length - 1) { size /= 1024; index += 1; } return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[index]}`; };
export const titleCase = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
export const severityClass = (value) => `severity-${String(value || 'unknown').toLowerCase()}`;

