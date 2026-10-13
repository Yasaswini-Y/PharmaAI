import { ArrowUpRight } from 'lucide-react';
export function MetricCard({ label, value, detail, tone = 'blue', icon: Icon }) { return <div className={`metric-card metric-card--${tone}`}><div className="metric-card-top"><span>{label}</span>{Icon && <Icon size={18} />}</div><strong>{value}</strong><small>{detail || <><ArrowUpRight size={13} /> Evidence-backed</>}</small></div>; }

