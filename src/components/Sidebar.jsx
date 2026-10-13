import {
  BrainCircuit,
  LayoutDashboard,
  UploadCloud,
  FileText,
  Target,
  Code2,
  Activity,
  ShieldAlert,
  Network,
  Boxes,
  Sparkles,
  GitBranch,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Database
} from 'lucide-react';

export function Sidebar({
  activeKey,
  activeAssessmentId,
  activeAssessmentView,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  isOpen,
  onClose,
  onSignOut,
  userEmail,
}) {
  const assessmentViews = [
    { key: 'overview', label: 'Overview', icon: Target },
    { key: 'analysis', label: 'Static Analysis', icon: Code2 },
    { key: 'readiness', label: 'Cloud Readiness', icon: Activity },
    { key: 'risks', label: 'Risk Register', icon: ShieldAlert },
    { key: 'dependencies', label: 'Dependencies', icon: Network },
    { key: 'architecture', label: 'Architecture Explorer', icon: Boxes },
    { key: 'recommendations', label: 'AI Advisor', icon: Sparkles },
    { key: 'roadmap', label: 'Migration Roadmap', icon: GitBranch },
    { key: 'reports', label: 'Engineering Report', icon: FileText },
  ];

  const userInitials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'MA';

  return (
    <aside className={`sidebar ${isCollapsed ? 'is-collapsed' : ''} ${isOpen ? 'is-open' : ''}`}>
      <div className="sidebar-header">
        <a href="#/dashboard" className="sidebar-brand">
          <div className="brand-symbol">
            <BrainCircuit size={18} />
          </div>
          {!isCollapsed && (
            <div className="brand-titles">
              <strong>ModernizeAI</strong>
              <span>Enterprise v1.4</span>
            </div>
          )}
        </a>
        <button
          className="icon-btn mobile-hidden"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <div className="sidebar-scroll">
        <div className="sidebar-group">
          <div className="sidebar-label">Portfolio</div>
          <button
            className={`nav-item ${activeKey === 'dashboard' ? 'is-active' : ''}`}
            onClick={() => onNavigate('/dashboard')}
            title="Portfolio Dashboard"
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>
          <button
            className={`nav-item ${activeKey === 'upload' ? 'is-active' : ''}`}
            onClick={() => onNavigate('/upload')}
            title="New Repository Assessment"
          >
            <UploadCloud size={18} />
            <span>New assessment</span>
          </button>
        </div>

        {activeAssessmentId && (
          <div className="sidebar-group">
            <div className="sidebar-label">Active Workspace</div>
            {assessmentViews.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                className={`nav-item ${
                  activeKey === 'assessment' && (activeAssessmentView === key || (!activeAssessmentView && key === 'overview'))
                    ? 'is-active'
                    : ''
                }`}
                onClick={() => onNavigate(`/assessment/${activeAssessmentId}/${key}`)}
                title={label}
              >
                <Icon size={17} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}

        <div className="sidebar-group" style={{ marginTop: 'auto' }}>
          <div className="sidebar-label">System</div>
          <button
            className="nav-item"
            onClick={() => window.open('/docs', '_blank')}
            title="API Specifications"
          >
            <Database size={17} />
            <span>API Docs (FastAPI)</span>
          </button>
          {onSignOut && (
            <button
              className="nav-item nav-item--danger"
              onClick={onSignOut}
              title="Sign Out of Session"
            >
              <LogOut size={17} />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="user-profile-pill" title={userEmail || 'Engineer'}>
          <div className="user-avatar-sm">{userInitials}</div>
          {!isCollapsed && (
            <div className="user-meta">
              <strong>{userEmail || 'Enterprise Lead'}</strong>
              <span>Org: ModernizeAI Core</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
