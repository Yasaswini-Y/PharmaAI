export function StatusBadge({ status }) { return <span className={`status-badge status-badge--${String(status || 'unknown').toLowerCase()}`}>{status || 'unknown'}</span>; }

