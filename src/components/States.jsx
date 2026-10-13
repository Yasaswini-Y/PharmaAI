import { AlertCircle, Inbox, LoaderCircle, RefreshCw } from 'lucide-react';
export function LoadingState({ label = 'Loading evidence...' }) { return <div className="state-panel"><LoaderCircle className="spin" size={22} /><span>{label}</span></div>; }
export function ErrorState({ message, onRetry }) { return <div className="state-panel state-panel--error"><AlertCircle size={22} /><div><strong>We could not load this view</strong><p>{message}</p>{onRetry && <button className="button button--secondary button--small" onClick={onRetry}><RefreshCw size={15} /> Retry</button>}</div></div>; }
export function EmptyState({ title, message, action }) { return <div className="state-panel"><Inbox size={24} /><div><strong>{title}</strong><p>{message}</p>{action}</div></div>; }

