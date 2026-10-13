import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  BrainCircuit,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  FileCode2,
  Workflow,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export function LoginPage() {
  const { signIn, signUp, signInAsGuest } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validate = () => {
    if (!email || !email.includes('@')) {
      setError('Please provide a valid enterprise email address.');
      return false;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters in length.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!validate()) return;

    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
        setSuccess('Registration initialized. Check your email inbox to verify your credentials.');
      }
    } catch (err) {
      const msg = err.message || 'Authentication failed. Please verify your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = () => {
    setError('');
    signInAsGuest('lead.architect@enterprise-modernize.ai');
  };

  return (
    <div className="login-container">
      <div className="login-split">
        {/* Left Editorial / Architectural Intelligence Dossier */}
        <div className="login-brand-panel">
          <div className="login-brand-header">
            <div className="login-brand-symbol">
              <BrainCircuit size={24} />
            </div>
            <div className="login-brand-text">
              <h2>ModernizeAI</h2>
              <span>Enterprise Modernization Platform</span>
            </div>
          </div>

          <div className="login-hero-copy">
            <div className="login-hero-badge">
              <ShieldCheck size={14} />
              <span>Deterministic Evidence Engine v1.4</span>
            </div>
            <h1>Legacy Modernization & Cloud Readiness Intelligence</h1>
            <p>
              Automated, deterministic discovery for legacy monoliths. Analyze AST dependencies,
              calculate verifiable Cloud Readiness Scores (CRS), and generate phased cloud migration plans.
            </p>

            <div className="login-feature-strip">
              <div className="login-feature-card">
                <Cpu size={18} />
                <strong>Deterministic CRS</strong>
                <span>Scored across 5 distinct pillars: Tech, Data, Security, Architecture, & Compliance.</span>
              </div>
              <div className="login-feature-card">
                <Workflow size={18} />
                <strong>Blast Radius Analysis</strong>
                <span>Graph-based direct & transitive dependency blast radius identification.</span>
              </div>
              <div className="login-feature-card">
                <FileCode2 size={18} />
                <strong>Evidence-Backed Findings</strong>
                <span>Every finding linked to concrete source code lines, rule IDs, and audit points.</span>
              </div>
              <div className="login-feature-card">
                <Sparkles size={18} />
                <strong>Phased Migration Plans</strong>
                <span>Rehost, replatform, and refactor trade-off matrices with validated roadmaps.</span>
              </div>
            </div>
          </div>

          <div className="login-panel-footer">
            <div className="login-status-indicator">
              <span className="login-status-dot" />
              <span>Production Analysis Engine Ready</span>
            </div>
            <span>SOC2 Type II Aligned · GxP Audit Traceable</span>
          </div>
        </div>

        {/* Right Authentication Terminal */}
        <div className="login-form-panel">
          <div className="login-form-box">
            <div className="login-form-heading">
              <h2>{mode === 'login' ? 'Enterprise Sign In' : 'Create Enterprise Account'}</h2>
              <p>
                {mode === 'login'
                  ? 'Access your organization’s application modernization workspace.'
                  : 'Register a new engineering profile to start analyzing repositories.'}
              </p>
            </div>

            <div className="login-tab-switch" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                className={`login-tab-btn ${mode === 'login' ? 'is-active' : ''}`}
                onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              >
                Sign In
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signup'}
                className={`login-tab-btn ${mode === 'signup' ? 'is-active' : ''}`}
                onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
              >
                Register
              </button>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              {error && (
                <div className="form-error-banner" role="alert">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="form-success-banner" role="status">
                  <CheckCircle2 size={16} />
                  <span>{success}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="auth-email">Corporate Email Address</label>
                <div className="form-input-wrap">
                  <Mail size={16} className="form-input-icon" />
                  <input
                    id="auth-email"
                    type="email"
                    className="form-input"
                    placeholder="architect@enterprise.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="auth-password">Password</label>
                <div className="form-input-wrap">
                  <Lock size={16} className="form-input-icon" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    className="form-input-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="button button--primary button--wide"
                disabled={loading}
              >
                {loading ? 'Authenticating…' : mode === 'login' ? 'Sign In to Workspace' : 'Create Account'}
                {!loading && <ArrowRight size={16} />}
              </button>

              <div className="login-divider">or quick evaluation</div>

              <button
                type="button"
                className="btn-demo-access"
                onClick={handleGuestAccess}
              >
                <Sparkles size={16} />
                <span>Launch Demo Workspace (1-Click Evaluation)</span>
              </button>
            </form>

            <div className="login-security-notice">
              <ShieldCheck size={18} />
              <span>
                Encrypted with TLS 1.3. Credentials managed securely via Supabase Auth with enterprise role-based access.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
