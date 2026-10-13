import { useState } from 'react';
import {
  Activity,
  Bell,
  ChevronRight,
  Copy,
  Check,
  FileDown,
  LogOut,
  Menu,
  Search,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export function AppHeader({
  health,
  healthError,
  assessment,
  currentView,
  onMenu,
  userEmail,
  onSignOut,
  onOpenSearch,
}) {
  const [copied, setCopied] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);

  const copyAssessmentId = () => {
    if (!assessment?.id) return;
    navigator.clipboard.writeText(assessment.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const notifications = [
    {
      id: 1,
      title: 'Static Analysis Rule Engine v1.4 Loaded',
      time: 'Just now',
      desc: 'AST patterns for Java 8-21, Spring Boot, and Struts loaded.',
    },
    {
      id: 2,
      title: 'Deterministic CRS Scorer Online',
      time: '12m ago',
      desc: '5-pillar weighted evaluation ready for incoming archives.',
    },
    {
      id: 3,
      title: 'Pharma GxP Boundary Policy Active',
      time: '1h ago',
      desc: 'Audit isolation active for 21 CFR Part 11 validation trails.',
    },
  ];

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="icon-btn mobile-menu" onClick={onMenu} aria-label="Open sidebar menu">
          <Menu size={18} />
        </button>

        <nav className="header-breadcrumbs" aria-label="Breadcrumbs">
          <a href="#/dashboard" className="breadcrumb-root">Workspace</a>
          <ChevronRight size={14} />
          {assessment ? (
            <>
              <a href={`#/assessment/${assessment.id}/overview`} className="breadcrumb-current">
                {assessment.application_name}
              </a>
              <button
                className="icon-btn"
                style={{ width: 24, height: 24 }}
                onClick={copyAssessmentId}
                title="Copy assessment UUID"
              >
                {copied ? <Check size={12} color="#12a26b" /> : <Copy size={12} />}
              </button>
              {currentView && currentView !== 'overview' && (
                <>
                  <ChevronRight size={14} />
                  <span style={{ textTransform: 'capitalize', color: 'var(--text-primary)', fontWeight: 600 }}>
                    {currentView}
                  </span>
                </>
              )}
            </>
          ) : (
            <span className="breadcrumb-current">Modernization Portfolio</span>
          )}
        </nav>
      </div>

      <div className="header-actions">
        {onOpenSearch && (
          <button
            className="button button--secondary button--small"
            onClick={onOpenSearch}
            title="Search assessments & repositories"
          >
            <Search size={14} />
            <span>Search</span>
            <kbd style={{ fontSize: '0.65rem', padding: '1px 5px', background: 'var(--bg-surface-subtle)', borderRadius: 3, border: '1px solid var(--border-subtle)' }}>
              /
            </kbd>
          </button>
        )}

        {/* Backend health status badge */}
        <button
          className={`health-badge ${healthError ? 'is-error' : health?.status === 'ok' ? 'is-healthy' : ''}`}
          onClick={() => setShowHealthModal(!showHealthModal)}
          title="Click to view API Gateway details"
        >
          <span className="health-dot" />
          <span>{healthError ? 'API Offline' : health?.status === 'ok' ? 'FastAPI 200 OK' : 'Checking API'}</span>
        </button>

        {/* Notifications drawer toggle */}
        <div style={{ position: 'relative' }}>
          <button
            className="icon-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
            aria-label="View notifications"
          >
            <Bell size={17} />
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: 44,
                right: 0,
                width: 320,
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 50,
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <strong style={{ fontSize: '0.85rem' }}>Engine Notifications</strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Real-time event feed</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '8px 10px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.78rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span>{n.title}</span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>{n.time}</span>
                    </div>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.74rem' }}>{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {onSignOut && (
          <button
            className="icon-btn"
            onClick={onSignOut}
            title="Sign out of ModernizeAI"
            aria-label="Sign out"
          >
            <LogOut size={17} />
          </button>
        )}
      </div>
    </header>
  );
}
