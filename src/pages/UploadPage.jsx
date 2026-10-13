import { useRef, useState } from 'react';
import {
  Archive,
  CheckCircle2,
  FileUp,
  UploadCloud,
  X,
  ShieldCheck,
  Cpu,
  Layers,
  AlertCircle
} from 'lucide-react';
import { uploadApplication, apiErrorMessage } from '../api/modernize.js';
import { SectionHeader } from '../components/SectionHeader.jsx';
import { formatBytes } from '../utils/format.js';

export function UploadPage({ onCreated }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [targetCloud, setTargetCloud] = useState('aws');
  const [criticality, setCriticality] = useState('tier1');
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState('idle'); // 'idle' | 'uploading' | 'analyzing' | 'complete' | 'error'
  const [error, setError] = useState('');

  const choose = (candidate) => {
    setError('');
    if (!candidate) return;
    if (!candidate.name.toLowerCase().endsWith('.zip')) {
      setError('Only ZIP repository archives are supported for deterministic analysis.');
      return;
    }
    setFile(candidate);
    setName(candidate.name.replace(/\.zip$/i, '').replace(/[-_]+/g, ' '));
    setState('idle');
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('Select a ZIP archive before starting the assessment.');
      return;
    }

    setState('uploading');
    setProgress(0);

    try {
      const result = await uploadApplication(file, name, (event) => {
        const pct = event.total ? Math.round((event.loaded / event.total) * 100) : 0;
        setProgress(pct);
        if (pct >= 100) {
          setState('analyzing');
        }
      });

      const assessment = result?.assessment ?? result;
      if (!assessment?.id) {
        throw new Error('The backend completed the upload but returned no assessment identifier.');
      }

      setState('complete');
      onCreated(assessment);
    } catch (requestError) {
      setState('error');
      setError(apiErrorMessage(requestError));
    }
  };

  return (
    <div className="page-stack">
      <SectionHeader
        eyebrow="Application Intake & Ingestion"
        title="Ingest Repository Archive"
        description="Upload a ZIP codebase to initiate sandbox extraction, static AST parsing, dependency graph construction, and deterministic cloud readiness evaluation."
      />

      <form className="upload-layout" onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(340px, 0.9fr)', gap: 20 }}>
        {/* Left Drag & Drop Zone */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            className={`drop-zone ${file ? 'has-file' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              choose(event.dataTransfer.files[0]);
            }}
            role="button"
            tabIndex={0}
            style={{
              minHeight: 340,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 32,
              border: '2px dashed var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-surface)',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'border-color var(--transition-fast), background-color var(--transition-fast)',
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".zip,application/zip"
              hidden
              onChange={(event) => choose(event.target.files[0])}
            />

            {file ? (
              <>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    backgroundColor: 'var(--cyan-50)',
                    color: 'var(--cyan-600)',
                    display: 'grid',
                    placeItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <CheckCircle2 size={32} />
                </div>
                <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  {file.name}
                </strong>
                <span className="mono" style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                  {formatBytes(file.size)} · Valid ZIP Archive
                </span>
                <button
                  type="button"
                  className="button button--ghost button--small"
                  style={{ marginTop: 14 }}
                  onClick={(event) => {
                    event.stopPropagation();
                    setFile(null);
                  }}
                >
                  <X size={14} />
                  <span>Choose different archive</span>
                </button>
              </>
            ) : (
              <>
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-surface-subtle)',
                    color: 'var(--teal-600)',
                    display: 'grid',
                    placeItems: 'center',
                    marginBottom: 14,
                  }}
                >
                  <UploadCloud size={30} />
                </div>
                <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  Drop repository archive here
                </strong>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  or click to select a local ZIP file
                </span>
                <p className="mono" style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', maxWidth: 320, margin: '14px 0 0' }}>
                  Supported: ZIP repositories up to 100MB. Unpacked inside isolated backend sandbox.
                </p>
              </>
            )}
          </div>

          {/* Pre-flight Security & Traceability Assurance */}
          <div className="content-section content-section--sunken" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: 'var(--teal-700)' }}>
              <ShieldCheck size={18} />
              <strong style={{ fontSize: '0.85rem' }}>Enterprise Analysis Safeguards</strong>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              <div>• <strong>Path traversal safe:</strong> Strict ZipSlip containment</div>
              <div>• <strong>Deterministic AST:</strong> No external LLM data leakage</div>
              <div>• <strong>Evidence audit trail:</strong> File and line-level citations</div>
              <div>• <strong>Isolated memory:</strong> Temp archives unlinked after ingestion</div>
            </div>
          </div>
        </div>

        {/* Right Configuration Panel */}
        <div className="content-section" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="section-toolbar" style={{ marginBottom: 16 }}>
              <div>
                <h2>Assessment Configuration</h2>
                <p>Define enterprise context for categorization and migration scoring.</p>
              </div>
              <Archive size={20} color="var(--teal-600)" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="app-name">Application name</label>
                <input
                  id="app-name"
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={255}
                  placeholder="e.g. claims-processing-service"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="target-cloud">Target Cloud Architecture</label>
                <select
                  id="target-cloud"
                  className="form-input"
                  value={targetCloud}
                  onChange={(e) => setTargetCloud(e.target.value)}
                  style={{ height: 42 }}
                >
                  <option value="aws">Amazon Web Services (AWS Architecture)</option>
                  <option value="azure">Microsoft Azure (Enterprise Cloud)</option>
                  <option value="gcp">Google Cloud Platform (GCP Anthos / K8s)</option>
                  <option value="hybrid">Multi-Cloud / Hybrid Enterprise</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="criticality">Business Criticality & Compliance Tier</label>
                <select
                  id="criticality"
                  className="form-input"
                  value={criticality}
                  onChange={(e) => setCriticality(e.target.value)}
                  style={{ height: 42 }}
                >
                  <option value="tier1">Tier 1: Mission Critical (24x7 / GxP Auditable)</option>
                  <option value="tier2">Tier 2: Core Business Workload</option>
                  <option value="tier3">Tier 3: Internal / Supporting Utility</option>
                </select>
              </div>
            </div>

            {/* Pipeline Progress Indicator */}
            {(state === 'uploading' || state === 'analyzing') && (
              <div style={{ margin: '20px 0', padding: 14, backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--teal-900)' }}>
                    {state === 'uploading' ? `Streaming archive (${progress}%)` : 'Executing static rules & scoring engine…'}
                  </span>
                  <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--cyan-600)' }}>
                    {state === 'uploading' ? `${progress}%` : 'Processing'}
                  </span>
                </div>
                <div style={{ width: '100%', height: 6, backgroundColor: 'var(--bg-surface-sunken)', borderRadius: 3, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: state === 'uploading' ? `${progress}%` : '90%',
                      height: '100%',
                      backgroundColor: 'var(--cyan-600)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <small style={{ display: 'block', marginTop: 8, fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                  Extracting AST trees, evaluating Java dependencies, and calculating cloud readiness score.
                </small>
              </div>
            )}

            {error && (
              <div className="form-error-banner" style={{ margin: '16px 0' }} role="alert">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {state === 'complete' && (
              <div className="form-success-banner" style={{ margin: '16px 0' }} role="status">
                <CheckCircle2 size={16} />
                <span>Archive successfully analyzed! Loading workspace…</span>
              </div>
            )}
          </div>

          <div style={{ marginTop: 24 }}>
            <button
              type="submit"
              className="button button--primary button--wide"
              disabled={state === 'uploading' || state === 'analyzing'}
              style={{ minHeight: 44, fontSize: '0.9rem' }}
            >
              <FileUp size={18} />
              <span>
                {state === 'uploading'
                  ? 'Uploading Archive…'
                  : state === 'analyzing'
                  ? 'Analyzing Repository…'
                  : 'Start analysis'}
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
