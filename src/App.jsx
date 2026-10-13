import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './contexts/AuthContext.jsx';
import { getHealth } from './api/health.js';
import { getAssessments } from './api/modernize.js';
import { AppHeader } from './components/AppHeader.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { UploadPage } from './pages/UploadPage.jsx';
import { AssessmentPage } from './pages/AssessmentPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { Search, X, ArrowRight } from 'lucide-react';

function parseLocation() {
  const parts = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'assessment' && parts[1]) {
    return { page: 'assessment', assessmentId: parts[1], view: parts[2] || 'overview' };
  }
  return { page: parts[0] === 'upload' ? 'upload' : 'dashboard', assessmentId: null, view: 'overview' };
}

export function navigate(path) {
  window.location.hash = path;
}

function AuthLoading() {
  return (
    <div className="auth-loading">
      <div className="auth-loading-inner">
        <div className="auth-loading-spinner" />
        <span>Initializing enterprise workspace…</span>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [location, setLocation] = useState(parseLocation);
  const [health, setHealth] = useState(null);
  const [healthError, setHealthError] = useState('');
  const [assessments, setAssessments] = useState([]);
  const [assessmentsError, setAssessmentsError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const onHashChange = () => {
      setLocation(parseLocation());
      setIsSidebarOpen(false);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!user) return;
    getHealth()
      .then(setHealth)
      .catch((error) => setHealthError(error.message || 'Backend unavailable.'));
    getAssessments({ limit: 100 })
      .then((data) => {
        setAssessments(data.items || []);
        setAssessmentsError('');
      })
      .catch((error) => {
        setAssessments([]);
        setAssessmentsError(error.message || 'Unable to load assessment history.');
      });
  }, [location.page, user]);

  const activeAssessment = useMemo(
    () => assessments.find((item) => item.id === location.assessmentId),
    [assessments, location.assessmentId]
  );

  const onAssessmentCreated = useCallback((assessment) => {
    if (!assessment?.id) return;
    setAssessments((current) => [assessment, ...current.filter((item) => item.id !== assessment.id)]);
    navigate(`/assessment/${assessment.id}/overview`);
  }, []);

  const onAssessmentRefresh = useCallback((assessment) => {
    setAssessments((current) =>
      current.map((item) => (item.id === assessment.id ? { ...item, ...assessment } : item))
    );
  }, []);

  const matchingAssessments = useMemo(() => {
    if (!searchQuery.trim()) return assessments.slice(0, 6);
    return assessments.filter(
      (a) =>
        a.application_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.original_filename?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [assessments, searchQuery]);

  const renderPage = () => {
    if (location.page === 'upload') return <UploadPage onCreated={onAssessmentCreated} />;
    if (location.page === 'assessment') {
      return (
        <AssessmentPage
          assessmentId={location.assessmentId}
          view={location.view}
          onRefresh={onAssessmentRefresh}
        />
      );
    }
    return (
      <DashboardPage
        assessments={assessments}
        error={assessmentsError}
        onOpen={(id) => navigate(`/assessment/${id}/overview`)}
      />
    );
  };

  /* ── Auth gate ── */
  if (authLoading) return <AuthLoading />;
  if (!user) return <LoginPage />;

  return (
    <div className="app-shell">
      <Sidebar
        activeKey={location.page}
        activeAssessmentId={location.assessmentId}
        activeAssessmentView={location.view}
        onNavigate={(path) => navigate(path)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSignOut={signOut}
        userEmail={user?.email}
      />

      <div className="app-frame">
        <AppHeader
          health={health}
          healthError={healthError}
          assessment={activeAssessment}
          currentView={location.page === 'assessment' ? location.view : null}
          onMenu={() => setIsSidebarOpen(true)}
          userEmail={user?.email}
          onSignOut={signOut}
          onOpenSearch={() => setIsSearchOpen(true)}
        />
        <main className="app-content">{renderPage()}</main>
      </div>

      {/* Global Quick Search Modal */}
      {isSearchOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(8, 43, 56, 0.6)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '12vh',
            zIndex: 100,
          }}
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 560,
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-xl)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
              <Search size={18} color="var(--text-tertiary)" style={{ marginRight: 10 }} />
              <input
                type="text"
                autoFocus
                placeholder="Search repositories, applications, or press Esc to exit…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.95rem',
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary)',
                }}
              />
              <button className="icon-btn" onClick={() => setIsSearchOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: 12, maxHeight: 360, overflowY: 'auto' }}>
              <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 8, padding: '0 8px' }}>
                Assessed Repositories ({matchingAssessments.length})
              </span>

              {matchingAssessments.length > 0 ? (
                matchingAssessments.map((a) => (
                  <button
                    key={a.id}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'transparent',
                      textAlign: 'left',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    onClick={() => {
                      setIsSearchOpen(false);
                      navigate(`/assessment/${a.id}/overview`);
                    }}
                  >
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                        {a.application_name}
                      </strong>
                      <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                        {a.original_filename}
                      </span>
                    </div>
                    <ArrowRight size={14} color="var(--text-tertiary)" />
                  </button>
                ))
              ) : (
                <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.82rem' }}>
                  No repositories matching "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
