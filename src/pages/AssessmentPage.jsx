import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Boxes,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Code2,
  Database,
  GitBranch,
  LockKeyhole,
  Network,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Target,
  FileText,
  Search,
  Filter,
  Layers,
  FileDown,
  Copy,
  Check,
  Printer,
  ChevronDown,
  X,
  ExternalLink,
  Info,
  SlidersHorizontal
} from 'lucide-react';
import {
  getAssessment,
  getDependencies,
  getImpact,
  getReadiness,
  getRecommendations,
  fetchRisks,
  generateRecommendations,
  apiErrorMessage
} from '../api/modernize.js';
import { ErrorState, EmptyState, LoadingState } from '../components/States.jsx';
import { SectionHeader } from '../components/SectionHeader.jsx';
import { ScoreRing } from '../components/ScoreRing.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { MermaidDiagram } from '../components/MermaidDiagram.jsx';
import { formatBytes, formatDate, severityClass, titleCase } from '../utils/format.js';
import { navigate } from '../App.jsx';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const getRisks = fetchRisks;

const tabs = [
  { key: 'overview', label: 'Overview', icon: Target },
  { key: 'analysis', label: 'Static Analysis', icon: Code2 },
  { key: 'readiness', label: 'Cloud Readiness (CRS)', icon: Activity },
  { key: 'risks', label: 'Risks & Pharma Review', icon: ShieldAlert },
  { key: 'dependencies', label: 'Dependencies & Blast Radius', icon: Network },
  { key: 'architecture', label: 'Architecture Explorer', icon: Boxes },
  { key: 'recommendations', label: 'AI Advisor', icon: Sparkles },
  { key: 'roadmap', label: 'Migration Roadmap', icon: GitBranch },
  { key: 'reports', label: 'Engineering Dossier', icon: FileText },
];

export function AssessmentPage({ assessmentId, view, onRefresh }) {
  const [assessment, setAssessment] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [risks, setRisks] = useState(null);
  const [dependencies, setDependencies] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [resourceErrors, setResourceErrors] = useState({});
  const [impact, setImpact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedNode, setSelectedNode] = useState('');
  const [impactLoading, setImpactLoading] = useState(false);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationError, setRecommendationError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setResourceErrors({});

    const result = await Promise.allSettled([
      getAssessment(assessmentId),
      getReadiness(assessmentId),
      getRisks(assessmentId),
      getDependencies(assessmentId),
      getRecommendations(assessmentId),
    ]);

    const [a, r, risk, dep, rec] = result;

    if (a.status === 'rejected') {
      setError(apiErrorMessage(a.reason));
    } else {
      setAssessment(a.value);
      onRefresh?.(a.value);
    }

    const failures = {};
    if (r.status === 'fulfilled') setReadiness(r.value);
    else failures.readiness = apiErrorMessage(r.reason);

    if (risk.status === 'fulfilled') setRisks(risk.value);
    else failures.risks = apiErrorMessage(risk.reason);

    if (dep.status === 'fulfilled') setDependencies(dep.value);
    else failures.dependencies = apiErrorMessage(dep.reason);

    if (rec.status === 'fulfilled') setRecommendations(rec.value);
    else failures.recommendations = apiErrorMessage(rec.reason);

    setResourceErrors(failures);
    setLoading(false);
  }, [assessmentId, onRefresh]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetchRisks(assessmentId)
      .then(setRisks)
      .catch(() => {});
  }, [assessmentId]);

  const runImpact = async (target) => {
    setSelectedNode(target);
    setImpactLoading(true);
    try {
      setImpact(await getImpact(assessmentId, target));
    } catch (requestError) {
      setImpact({
        message: apiErrorMessage(requestError),
        target,
        direct_dependents: [],
        transitive_dependents: [],
        direct_dependencies: [],
        transitive_dependencies: [],
        evidence_edges: [],
      });
    } finally {
      setImpactLoading(false);
    }
  };

  const runRecommendations = async () => {
    setRecommendationLoading(true);
    setRecommendationError('');
    try {
      setRecommendations(await generateRecommendations(assessmentId));
    } catch (requestError) {
      setRecommendationError(apiErrorMessage(requestError));
    } finally {
      setRecommendationLoading(false);
    }
  };

  if (loading) return <LoadingState label="Loading assessment evidence and analysis models…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!assessment) return <EmptyState title="Assessment not found" message="This assessment is not available in the backend repository." />;

  const activeTabKey = tabs.some((tab) => tab.key === view) ? view : 'overview';

  const contentMap = {
    overview: <Overview assessment={assessment} readiness={readiness} risks={risks} onNavigateTab={(k) => navigate(`/assessment/${assessmentId}/${k}`)} />,
    analysis: <Analysis assessment={assessment} />,
    readiness: <Readiness readiness={readiness} />,
    risks: <Risks risks={risks} />,
    dependencies: (
      <Dependencies
        dependencies={dependencies}
        resourceError={resourceErrors.dependencies}
        selectedNode={selectedNode}
        setSelectedNode={setSelectedNode}
        impact={impact}
        impactLoading={impactLoading}
        runImpact={runImpact}
      />
    ),
    architecture: <Architecture assessment={assessment} recommendations={recommendations} />,
    recommendations: (
      <Recommendations
        recommendations={recommendations}
        resourceError={resourceErrors.recommendations}
        loading={recommendationLoading}
        error={recommendationError}
        onGenerate={runRecommendations}
      />
    ),
    roadmap: <Roadmap recommendations={recommendations} />,
    reports: <Reports assessment={assessment} readiness={readiness} risks={risks} recommendations={recommendations} />,
  };

  return (
    <div className="page-stack">
      {/* Titlebar */}
      <div className="assessment-titlebar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#b5dbe8' }}>
            <button
              className="text-button"
              style={{ color: '#8fe6f7', fontWeight: 600 }}
              onClick={() => navigate('/dashboard')}
            >
              Portfolio Dashboard
            </button>
            <ChevronRight size={13} />
            <span>Workspace</span>
          </div>
          <h1>{assessment.application_name}</h1>
          <p>
            Archive: {assessment.original_filename} · Ingested {formatDate(assessment.created_at)}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <StatusBadge status={assessment.status} />
          <button className="icon-btn" style={{ color: '#ffffff' }} onClick={load} title="Refresh analysis evidence">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="assessment-tabs" aria-label="Assessment views">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={activeTabKey === key ? 'is-active' : ''}
            onClick={() => navigate(`/assessment/${assessmentId}/${key}`)}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Render Active View */}
      {contentMap[activeTabKey]}
    </div>
  );
}

/* ──────────────────── 1. OVERVIEW ──────────────────── */
export function Overview({ assessment, readiness, risks, onNavigateTab }) {
  const summary = assessment.source_summary || {};
  const riskItems = Array.isArray(risks)
    ? risks
    : Array.isArray(risks?.items)
    ? risks.items
    : Array.isArray(risks?.data)
    ? risks.data
    : [];

  const highRisks = risks == null ? null : riskItems.filter((risk) => ['high', 'critical'].includes(risk.severity)).length;
  const verifiedFindings = assessment.findings?.length || 0;
  const edgeCount = summary.dependency_graph?.edge_count ?? '—';

  return (
    <>
      <SectionHeader
        eyebrow="Evidence Snapshot"
        title="Assessment overview"
        description="Grounded metrics compiled from extracted AST parsing, deterministic dependency graph, and rule-based evaluation."
      />

      <div className="overview-grid">
        {/* Scorecard Hero */}
        <div className="content-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 28 }}>
          <div>
            <span className="section-eyebrow">Deterministic Modernization Metric</span>
            <h2 style={{ fontSize: '1.4rem', margin: '6px 0 8px' }}>
              {readiness ? 'Cloud Readiness Score (CRS)' : 'CRS Pending Computation'}
            </h2>
            <p style={{ maxWidth: 360, color: 'var(--text-secondary)', fontSize: '0.84rem', margin: 0, lineHeight: 1.5 }}>
              {readiness
                ? readiness.formula || 'CRS = 0.25T + 0.20D + 0.20S + 0.20A + 0.15C'
                : 'Deterministic scoring awaiting backend engine evaluation.'}
            </p>
            {readiness?.unknowns?.length > 0 && (
              <span className="mono" style={{ display: 'inline-block', marginTop: 12, color: 'var(--status-warning-text)', fontSize: '0.74rem' }}>
                ⚠ {readiness.unknowns.length} scoring factor(s) flagged with unknowns
              </span>
            )}
          </div>
          <ScoreRing score={readiness?.overall_score} />
        </div>

        {/* Repository Profile */}
        <div className="content-section">
          <div className="section-toolbar">
            <h2>Repository Profile & Manifests</h2>
            <Database size={18} color="var(--teal-600)" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <ProfileRow label="Files Analyzed" value={summary.analyzed_files ?? '—'} />
            <ProfileRow label="Unsupported / Binary Files" value={summary.unsupported_file_count ?? '—'} />
            <ProfileRow
              label="Detected Frameworks"
              value={summary.frameworks?.length ? summary.frameworks.join(', ') : 'None detected'}
            />
            <ProfileRow
              label="Databases Referenced"
              value={summary.databases?.length ? summary.databases.join(', ') : 'None detected'}
            />
            <ProfileRow
              label="Archive Size"
              value={formatBytes(assessment.application?.compressed_size_bytes)}
            />
          </div>
        </div>
      </div>

      {/* Key Metric Strip */}
      <div className="metric-grid metric-grid--three">
        <div className="metric-card">
          <div className="metric-card-top">
            <span>Verified Findings</span>
            <CheckCircle2 size={16} color="var(--cyan-600)" />
          </div>
          <strong>{verifiedFindings}</strong>
          <small>Persisted AST static findings</small>
        </div>
        <div className="metric-card">
          <div className="metric-card-top">
            <span>High & Critical Risks</span>
            <AlertTriangle size={16} color="#d97706" />
          </div>
          <strong>{highRisks === null ? '—' : highRisks}</strong>
          <small>Security & architecture flags</small>
        </div>
        <div className="metric-card">
          <div className="metric-card-top">
            <span>Dependency Graph Edges</span>
            <Network size={16} color="var(--teal-600)" />
          </div>
          <strong>{edgeCount}</strong>
          <small>Extracted relationship links</small>
        </div>
      </div>
    </>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '11px 0',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '0.82rem',
      }}
    >
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <strong style={{ color: 'var(--text-primary)', maxWidth: '65%', textAlign: 'right' }}>
        {value}
      </strong>
    </div>
  );
}

/* ──────────────────── 2. STATIC ANALYSIS & FINDINGS ──────────────────── */
function Analysis({ assessment }) {
  const summary = assessment.source_summary || {};
  const findings = assessment.findings || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [inspectFinding, setInspectFinding] = useState(null);

  const categories = useMemo(() => {
    return Object.entries(
      findings.reduce((map, item) => ({ ...map, [item.category]: (map[item.category] || 0) + 1 }), {})
    ).map(([name, count]) => ({ name: titleCase(name), raw: name, count }));
  }, [findings]);

  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      const matchSearch =
        !searchQuery.trim() ||
        f.rule_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.file_path?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.evidence?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCat = selectedCategory === 'all' || f.category === selectedCategory;
      const matchSev = selectedSeverity === 'all' || f.severity === selectedSeverity;

      return matchSearch && matchCat && matchSev;
    });
  }, [findings, searchQuery, selectedCategory, selectedSeverity]);

  return (
    <>
      <SectionHeader
        eyebrow="Static AST Rule Engine"
        title="Technology Discovery & Code Findings"
        description="Deterministic AST inspection across repository source code, configuration descriptors, and dependency manifests."
      />

      <div className="analysis-grid">
        {/* Technology Manifests */}
        <div className="content-section">
          <div className="section-toolbar">
            <h2>Detected Technology Ecosystem</h2>
            <Code2 size={18} color="var(--teal-600)" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <TagGroup label="Frameworks" values={summary.frameworks} />
            <TagGroup label="Libraries & Dependencies" values={summary.libraries} />
            <TagGroup label="Databases" values={summary.databases} />
            <TagGroup label="Java Runtime Versions" values={summary.java_versions} />
            <TagGroup label="Config Descriptors" values={summary.configuration_files} />
          </div>
        </div>

        {/* Findings by Category Chart */}
        <div className="content-section">
          <div className="section-toolbar">
            <h2>Findings Distribution by Category</h2>
            <BarChart3 size={18} color="var(--teal-600)" />
          </div>
          {categories.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categories} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-subtle)" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--teal-600)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No findings category data" message="Analyzer did not persist categorized findings." />
          )}
        </div>
      </div>

      {/* Findings Explorer */}
      <section className="content-section">
        <div className="section-toolbar" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div className="section-toolbar-left">
            <h2>Evidence Findings Explorer</h2>
            <p>Every finding links directly to a deterministic rule ID and concrete source code evidence.</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative', width: 220 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                placeholder="Filter by rule, file, or keyword…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: 34,
                  padding: '0 10px 0 32px',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  backgroundColor: 'var(--bg-surface)',
                }}
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                height: 34,
                padding: '0 10px',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.raw} value={c.raw}>
                  {c.name} ({c.count})
                </option>
              ))}
            </select>

            {/* Severity Filter */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              style={{
                height: 34,
                padding: '0 10px',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
              {filteredFindings.length} findings
            </span>
          </div>
        </div>

        {filteredFindings.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Rule ID</th>
                  <th>Finding Message & Evidence</th>
                  <th>Source Location</th>
                  <th>Severity</th>
                  <th>Confidence</th>
                  <th style={{ textAlign: 'right' }}>Inspect</th>
                </tr>
              </thead>
              <tbody>
                {filteredFindings.map((finding) => (
                  <tr key={finding.id} style={{ cursor: 'pointer' }} onClick={() => setInspectFinding(finding)}>
                    <td className="mono" style={{ fontWeight: 600 }}>{finding.rule_id}</td>
                    <td>
                      <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{finding.message}</strong>
                      {finding.evidence && (
                        <span className="mono" style={{ display: 'block', marginTop: 4, color: 'var(--text-secondary)', fontSize: '0.73rem' }}>
                          {finding.evidence}
                        </span>
                      )}
                    </td>
                    <td className="mono">
                      {finding.file_path || 'Repository root'}
                      {finding.line_number ? `:${finding.line_number}` : ''}
                    </td>
                    <td>
                      <span className={`severity-pill ${severityClass(finding.severity)}`}>
                        {finding.severity}
                      </span>
                    </td>
                    <td className="mono">{finding.confidence || 'verified'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="button button--secondary button--small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectFinding(finding);
                        }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No evidence findings matched"
            message={searchQuery ? 'Try broadening your search term or category filters.' : 'No static findings persisted for this codebase.'}
          />
        )}
      </section>

      {/* Evidence Inspector Modal / Drawer */}
      {inspectFinding && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(8, 43, 56, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            padding: 20,
          }}
          onClick={() => setInspectFinding(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 680,
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-xl)',
              padding: 26,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <span className="mono" style={{ color: 'var(--cyan-600)', fontWeight: 700 }}>
                  Rule ID: {inspectFinding.rule_id}
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                  {inspectFinding.message}
                </h3>
              </div>
              <button className="icon-btn" onClick={() => setInspectFinding(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 18 }}>
              <div style={{ padding: 10, backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Severity</span>
                <div style={{ marginTop: 4 }}>
                  <span className={`severity-pill ${severityClass(inspectFinding.severity)}`}>
                    {inspectFinding.severity}
                  </span>
                </div>
              </div>
              <div style={{ padding: 10, backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Category</span>
                <div style={{ marginTop: 4, fontWeight: 600, fontSize: '0.82rem' }}>
                  {titleCase(inspectFinding.category)}
                </div>
              </div>
              <div style={{ padding: 10, backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Confidence</span>
                <div style={{ marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                  {inspectFinding.confidence || 'high'}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Source Code Location
              </label>
              <div className="mono" style={{ padding: '8px 12px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', marginTop: 4, fontSize: '0.8rem' }}>
                {inspectFinding.file_path || 'Repository root'}
                {inspectFinding.line_number ? ` (Line ${inspectFinding.line_number})` : ''}
              </div>
            </div>

            {inspectFinding.evidence && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Concrete Evidence Snippet
                </label>
                <pre
                  className="mono"
                  style={{
                    padding: 14,
                    backgroundColor: 'var(--teal-950)',
                    color: '#a5f0fb',
                    borderRadius: 'var(--radius-sm)',
                    marginTop: 4,
                    fontSize: '0.78rem',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {inspectFinding.evidence}
                </pre>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="button button--secondary" onClick={() => setInspectFinding(null)}>
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TagGroup({ label, values = [] }) {
  return (
    <div>
      <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {values?.length ? (
          values.map((v) => (
            <span key={v} className="tag">
              {v}
            </span>
          ))
        ) : (
          <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
            None detected
          </span>
        )}
      </div>
    </div>
  );
}

/* ──────────────────── 3. CLOUD READINESS (CRS) ──────────────────── */
function Readiness({ readiness }) {
  if (!readiness) {
    return (
      <EmptyState
        title="Cloud readiness score not available"
        message="The deterministic scorer did not return readiness output for this assessment."
      />
    );
  }

  const factors = [
    { key: 'technology_score', label: 'Technology Stack', weight: '25%', weightNum: 0.25 },
    { key: 'data_score', label: 'Data Architecture', weight: '20%', weightNum: 0.2 },
    { key: 'security_score', label: 'Security & Auth', weight: '20%', weightNum: 0.2 },
    { key: 'architecture_score', label: 'Architecture Coupling', weight: '20%', weightNum: 0.2 },
    { key: 'compliance_score', label: 'Compliance & Auditability', weight: '15%', weightNum: 0.15 },
  ];

  const chart = factors.map((factor) => ({
    name: factor.label,
    score: readiness[factor.key] ?? 0,
  }));

  const unknownLabel = (item) =>
    typeof item === 'string' ? item : [item.factor, item.reason].filter(Boolean).join(': ');

  return (
    <>
      <SectionHeader
        eyebrow="Deterministic Metric"
        title="Cloud Readiness Score (CRS) Engine"
        description="CRS = 0.25T + 0.20D + 0.20S + 0.20A + 0.15C. Transparent scoring deductions with full auditability."
      />

      <div className="readiness-layout">
        {/* Main Scorecard */}
        <div className="content-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 28 }}>
          <div>
            <span className="section-eyebrow">Overall Weighted Index</span>
            <h2 style={{ fontSize: '1.6rem', margin: '4px 0 6px' }}>{readiness.overall_score}/100</h2>
            <p className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
              {readiness.formula}
            </p>

            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {readiness.unknowns?.length ? (
                readiness.unknowns.map((item) => (
                  <div key={unknownLabel(item)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--status-warning-text)' }}>
                    <AlertTriangle size={14} />
                    <span>{unknownLabel(item)}</span>
                  </div>
                ))
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--status-success-text)' }}>
                  <CheckCircle2 size={14} />
                  <span>All scoring pillars had direct evidence inputs.</span>
                </div>
              )}
            </div>
          </div>
          <ScoreRing score={readiness.overall_score} label="Overall CRS" />
        </div>

        {/* Factor Breakdown Bar Chart */}
        <div className="content-section">
          <div className="section-toolbar">
            <h2>Pillar Breakdown (0–100)</h2>
            <BarChart3 size={18} color="var(--teal-600)" />
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="score" fill="var(--teal-600)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5 Factor Cards Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
        {factors.map((f) => {
          const score = readiness[f.key] ?? '—';
          return (
            <div key={f.key} className="content-section" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                  {f.label}
                </span>
                <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--cyan-600)' }}>{f.weight}</span>
              </div>
              <strong style={{ fontSize: '1.4rem', color: 'var(--text-primary)' }}>
                {score}
                {typeof score === 'number' && <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>/100</span>}
              </strong>
            </div>
          );
        })}
      </div>

      {/* Transparent Deductions Audit Trail */}
      <div className="content-section">
        <div className="section-toolbar">
          <div className="section-toolbar-left">
            <h2>Transparent Deductions Audit Log</h2>
            <p>Direct explanation of every point lost according to the scoring policy.</p>
          </div>
          <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            {readiness.deductions?.length || 0} deductions recorded
          </span>
        </div>

        {readiness.deductions?.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Points Deducted</th>
                  <th>Justification / Reason</th>
                  <th>Rule Reference</th>
                  <th>Evidence Link</th>
                </tr>
              </thead>
              <tbody>
                {readiness.deductions.map((item, index) => (
                  <tr key={`${item.rule_id || item.reason}-${index}`}>
                    <td>
                      <span className="mono" style={{ color: 'var(--status-danger-text)', fontWeight: 700, fontSize: '0.9rem' }}>
                        -{item.points ?? item.deduction ?? '—'}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{item.reason || item.message}</strong>
                    </td>
                    <td className="mono">{item.rule_id || 'GENERAL-RULE'}</td>
                    <td className="mono" style={{ fontSize: '0.73rem' }}>
                      {item.evidence_ref ? JSON.stringify(item.evidence_ref) : 'See persisted evidence findings'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No scoring deductions"
            message="No deductions were recorded by the deterministic readiness engine."
          />
        )}
      </div>
    </>
  );
}

/* ──────────────────── 4. RISKS & PHARMA REVIEW ──────────────────── */
export function Risks({ risks }) {
  const riskItems = Array.isArray(risks)
    ? risks
    : Array.isArray(risks?.items)
    ? risks.items
    : Array.isArray(risks?.data)
    ? risks.data
    : [];

  const [filterCat, setFilterCat] = useState('all');

  if (!riskItems.length && risks == null) {
    return (
      <EmptyState
        title="Risk review unavailable"
        message="The backend did not return risk flags for this assessment."
      />
    );
  }

  const grouped = riskItems.reduce((map, risk) => {
    const key = risk.category || 'general';
    map[key] = [...(map[key] || []), risk];
    return map;
  }, {});

  const chart = Object.entries(
    riskItems.reduce((map, item) => ({ ...map, [item.severity]: (map[item.severity] || 0) + 1 }), {})
  ).map(([name, value]) => ({ name, value }));

  const filteredItems = filterCat === 'all' ? riskItems : grouped[filterCat] || [];

  return (
    <>
      <SectionHeader
        eyebrow="Risk Register & Regulatory Audit"
        title="Risks and pharma review"
        description="Security, architectural compatibility, and pharmaceutical GxP validation considerations grounded in code evidence."
      />

      <div className="risk-summary">
        {/* Severity Distribution */}
        <div className="content-section">
          <div className="section-toolbar">
            <h2>Severity Distribution</h2>
            <PieChart size={18} color="var(--teal-600)" />
          </div>
          {chart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={chart} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={4}>
                  {chart.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={['#e5484d', '#f5a524', '#22a8cf', '#8aa4b3'][index % 4]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No risk flags recorded" message="Zero risk flags returned from analyzer." />
          )}
        </div>

        {/* Pharma Validation Boundary Callout */}
        <div
          className="content-section"
          style={{
            backgroundColor: 'var(--teal-950)',
            color: '#ffffff',
            borderColor: 'var(--border-dark)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--cyan-400)' }}>
              <LockKeyhole size={20} />
              <strong style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Pharma & GxP Validation Boundary
              </strong>
            </div>
            <h3 style={{ margin: '12px 0 8px', fontSize: '1.15rem', color: '#ffffff' }}>
              Regulatory Traceability & Review Scope
            </h3>
            <p style={{ color: '#b5dbe8', fontSize: '0.84rem', lineHeight: 1.6, margin: 0 }}>
              Life sciences & pharma entries represent validation considerations for qualification engineers under
              21 CFR Part 11 and GxP standards. Evidence links remain attached to each flag for audit traceability.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: 'var(--cyan-400)' }}>
            <CheckCircle2 size={16} />
            <span>Immutable evidence references attached to every flag</span>
          </div>
        </div>
      </div>

      {/* Risk Items Filter Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0' }}>
        <button
          className={`button ${filterCat === 'all' ? 'button--primary' : 'button--secondary'} button--small`}
          onClick={() => setFilterCat('all')}
        >
          All Categories ({riskItems.length})
        </button>
        {Object.keys(grouped).map((cat) => (
          <button
            key={cat}
            className={`button ${filterCat === cat ? 'button--primary' : 'button--secondary'} button--small`}
            onClick={() => setFilterCat(cat)}
          >
            {titleCase(cat)} ({grouped[cat].length})
          </button>
        ))}
      </div>

      {/* Risk Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filteredItems.length > 0 ? (
          filteredItems.map((risk) => (
            <div key={risk.id} className="content-section" style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 'var(--radius-sm)',
                      display: 'grid',
                      placeItems: 'center',
                      backgroundColor: risk.severity === 'critical' || risk.severity === 'high' ? 'var(--status-danger-bg)' : 'var(--status-warning-bg)',
                      color: risk.severity === 'critical' || risk.severity === 'high' ? 'var(--status-danger-text)' : 'var(--status-warning-text)',
                      flex: '0 0 32px',
                    }}
                  >
                    <AlertTriangle size={17} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{risk.title}</strong>
                    <p style={{ margin: '6px 0 10px', color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.5 }}>
                      {risk.description}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
                        {risk.rule_id} · {risk.evidence_refs?.length || 0} evidence reference(s)
                      </span>
                    </div>
                  </div>
                </div>
                <span className={`severity-pill ${severityClass(risk.severity)}`}>
                  {risk.severity}
                </span>
              </div>
            </div>
          ))
        ) : (
          <EmptyState title="No risks to review" message="The backend returned an empty risk register for this filter." />
        )}
      </div>
    </>
  );
}

/* ──────────────────── 5. DEPENDENCIES & BLAST RADIUS ──────────────────── */
function Dependencies({ dependencies, selectedNode, setSelectedNode, impact, impactLoading, runImpact }) {
  const [filter, setFilter] = useState('');

  if (!dependencies) {
    return (
      <EmptyState
        title="Dependency graph unavailable"
        message="The backend did not return persisted graph nodes and edges for this assessment."
      />
    );
  }

  const nodes = dependencies.nodes || [];
  const edges = dependencies.edges || [];

  const visibleNodes = nodes.filter(
    (node) =>
      node.label.toLowerCase().includes(filter.toLowerCase()) ||
      node.node_key.toLowerCase().includes(filter.toLowerCase())
  );

  const graphDefinition = useMemo(() => buildDependencyMermaid(nodes, edges), [nodes, edges]);

  return (
    <>
      <SectionHeader
        eyebrow="Architectural Graph Intelligence"
        title="Dependency Graph & Blast Radius Impact"
        description="Discovered package, library, and framework connections. Select any node to calculate direct and transitive blast radius."
      />

      {/* Main Graph View */}
      <div className="content-section">
        <div className="section-toolbar">
          <div>
            <h2>Persisted Dependency Architecture Graph</h2>
            <p>{nodes.length} nodes · {edges.length} evidence-backed dependency links</p>
          </div>
          <Network size={18} color="var(--teal-600)" />
        </div>
        <MermaidDiagram definition={graphDefinition} title="Dependency Graph" />
      </div>

      {/* Dual Layout: Node Selector & Impact View */}
      <div className="dependency-layout">
        {/* Nodes Directory */}
        <div className="content-section">
          <div className="section-toolbar">
            <h2>Graph Nodes Directory</h2>
            <input
              type="text"
              placeholder="Search nodes…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                height: 32,
                padding: '0 8px',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
              }}
            />
          </div>

          {visibleNodes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 380, overflowY: 'auto' }}>
              {visibleNodes.map((node) => (
                <button
                  key={node.node_key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    border: '1px solid',
                    borderColor: selectedNode === node.node_key ? 'var(--cyan-600)' : 'var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: selectedNode === node.node_key ? 'var(--cyan-50)' : 'var(--bg-surface-elevated)',
                    textAlign: 'left',
                  }}
                  onClick={() => {
                    setSelectedNode(node.node_key);
                    runImpact(node.node_key);
                  }}
                >
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                      {node.label}
                    </strong>
                    <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                      {node.node_key}
                    </span>
                  </div>
                  <span className="tag" style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                    {node.node_type || 'component'}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title="No matching nodes" message="No nodes match your search query." />
          )}
        </div>

        {/* Impact Analysis & Blast Radius */}
        <div className="content-section">
          <div className="section-toolbar">
            <h2>Impact Analysis & Blast Radius</h2>
            <GitBranch size={18} color="var(--teal-600)" />
          </div>

          {impactLoading ? (
            <LoadingState label="Calculating direct and transitive blast radius…" />
          ) : impact ? (
            <ImpactView impact={impact} />
          ) : (
            <EmptyState
              title="Select a node to inspect"
              message="Click any node in the list on the left to evaluate its upstream and downstream blast radius."
            />
          )}
        </div>
      </div>
    </>
  );
}

function ImpactView({ impact }) {
  const sections = [
    ['Direct Dependents (Blast Impact)', impact.direct_dependents],
    ['Transitive Dependents (Cascading)', impact.transitive_dependents],
    ['Direct Dependencies (Prerequisites)', impact.direct_dependencies],
    ['Transitive Dependencies (Deep Tree)', impact.transitive_dependencies],
  ];

  const totalBlast = (impact.direct_dependents?.length || 0) + (impact.transitive_dependents?.length || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div
        style={{
          padding: '12px 14px',
          borderLeft: '4px solid var(--cyan-600)',
          backgroundColor: 'var(--bg-surface-elevated)',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Target Node</span>
        <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--teal-900)', marginTop: 2 }}>
          {impact.target}
        </strong>
        <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
          Total downstream blast radius: {totalBlast} impacted component(s)
        </span>
      </div>

      {impact.message && (
        <p className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
          {impact.message}
        </p>
      )}

      {sections.map(([label, values]) => (
        <div key={label} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
          <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 6 }}>
            {label} ({values?.length || 0})
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {values?.length ? (
              values.map((v) => (
                <span key={v} className="tag" style={{ fontSize: '0.72rem' }}>
                  {v}
                </span>
              ))
            ) : (
              <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
                None observed
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function buildDependencyMermaid(nodes, edges) {
  if (!nodes.length) return '';
  const safe = (value) => `n_${String(value).replace(/[^A-Za-z0-9_]/g, '_').slice(0, 45)}`;
  const labels = nodes.slice(0, 60).map((node) => `  ${safe(node.node_key)}["${String(node.label).replaceAll('"', "'").slice(0, 60)}"]`);
  const lines = edges.slice(0, 80).map((edge) => `  ${safe(edge.source_key)} -->|${String(edge.relationship).replaceAll('|', '/')}| ${safe(edge.target_key)}`);
  return ['flowchart LR', ...labels, ...lines].join('\n');
}

/* ──────────────────── 6. ARCHITECTURE EXPLORER ──────────────────── */
function Architecture({ assessment, recommendations }) {
  const summary = assessment.source_summary || {};
  const detected = useMemo(() => buildCurrentArchitecture(summary), [summary]);
  const proposed = recommendations?.mermaid_diagram;

  return (
    <>
      <SectionHeader
        eyebrow="Architectural Topology"
        title="Architecture Explorer: Current vs Target"
        description="Compare verified current state architecture with validated AI proposed target cloud architecture."
      />

      <div className="architecture-grid">
        {/* Detected State */}
        <section className="content-section">
          <div className="section-toolbar">
            <div>
              <span className="section-eyebrow">Current State Topology</span>
              <h2>Detected Monolithic State</h2>
            </div>
            <span className="tag">Current State</span>
          </div>
          <MermaidDiagram definition={detected} title="Detected Current State Architecture" />
          <small style={{ display: 'block', marginTop: 10, fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
            Extracted from framework manifestations, database drivers, and configuration files in assessment summary.
          </small>
        </section>

        {/* Proposed Target State */}
        <section className="content-section">
          <div className="section-toolbar">
            <div>
              <span className="section-eyebrow">Cloud Modernization Target</span>
              <h2>Proposed Cloud Target State</h2>
            </div>
            <span className="tag" style={{ backgroundColor: 'var(--cyan-50)', color: 'var(--cyan-600)' }}>
              Target State
            </span>
          </div>
          <MermaidDiagram definition={proposed} title="Proposed Cloud Target Architecture" />
          <small style={{ display: 'block', marginTop: 10, fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
            Rendered from validated AI advisor proposal. Microservice decomposition and managed cloud storage.
          </small>
        </section>
      </div>

      {/* Architectural Shift Notes */}
      <div className="content-section content-section--sunken" style={{ padding: 20 }}>
        <h3 style={{ margin: '0 0 10px', fontSize: '0.95rem' }}>Modernization Architectural Delta</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, fontSize: '0.8rem' }}>
          <div>
            <strong>1. Compute Modernization</strong>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>
              Monolithic application server decoupled into containerized microservices (AWS ECS / EKS or GCP Cloud Run).
            </p>
          </div>
          <div>
            <strong>2. Data Modernization</strong>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>
              On-prem legacy RDBMS transitioned to managed cloud database (Amazon Aurora / Cloud SQL) with read replicas.
            </p>
          </div>
          <div>
            <strong>3. Integration Modernization</strong>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>
              Direct synchronous coupling replaced with asynchronous event messaging (Kafka / SQS) and API Gateway.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function buildCurrentArchitecture(summary) {
  const nodes = [{ id: 'app', label: 'Uploaded Codebase' }];
  (summary.frameworks || []).forEach((item, index) => nodes.push({ id: `fw${index}`, label: item }));
  (summary.databases || []).forEach((item, index) => nodes.push({ id: `db${index}`, label: item }));
  const safe = (value) => `n_${String(value).replace(/[^A-Za-z0-9_]/g, '_').slice(0, 40)}`;
  return [
    'flowchart LR',
    ...nodes.map((node) => `  ${safe(node.id)}["${node.label.replaceAll('"', "'")}"]`),
    ...nodes.slice(1).map((node) => `  ${safe('app')} -->|detected| ${safe(node.id)}`),
  ].join('\n');
}

/* ──────────────────── 7. AI ADVISOR ──────────────────── */
function Recommendations({ recommendations, loading, error, onGenerate }) {
  const sections = recommendations?.recommendations || [];
  const byCategory = (category) => sections.find((item) => item.category === category);

  const strategy = byCategory('modernization_strategy');
  const tradeoffs = parseSection(byCategory('tradeoffs'));
  const upgrades = parseSection(byCategory('technology_upgrades'));
  const risks = parseSection(byCategory('migration_risks'));
  const pharma = parseSection(byCategory('pharma_validation'));

  return (
    <>
      <SectionHeader
        eyebrow="Architectural Intelligence"
        title="Modernization Recommendations & Advisor"
        description="AI advisor recommendations grounded in sanitized structured findings and validated against strict schemas."
        action={
          <button className="button button--primary" onClick={onGenerate} disabled={loading}>
            <Sparkles size={16} />
            <span>{loading ? 'Evaluating Model…' : sections.length ? 'Regenerate Recommendations' : 'Generate Recommendations'}</span>
          </button>
        }
      />

      {error && (
        <div className="form-error-banner" style={{ margin: '12px 0' }} role="alert">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {!sections.length && !loading ? (
        <EmptyState
          title="No AI recommendations generated yet"
          message="Trigger the recommendation engine to generate strategic trade-offs, technology upgrades, and risk mitigations."
          action={
            <button className="button button--primary" onClick={onGenerate}>
              <Sparkles size={16} />
              <span>Generate now</span>
            </button>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Strategy Card */}
          {strategy && (
            <div
              className="content-section"
              style={{
                backgroundColor: 'var(--teal-950)',
                color: '#ffffff',
                borderColor: 'var(--border-dark)',
                padding: 24,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--cyan-400)', marginBottom: 8 }}>
                <BrainCircuit size={20} />
                <span className="mono" style={{ fontSize: '0.76rem', textTransform: 'uppercase' }}>Recommended Strategy</span>
              </div>
              <h2 style={{ fontSize: '1.4rem', color: '#ffffff', margin: '4px 0 10px' }}>{strategy.title}</h2>
              <p style={{ color: '#b5dbe8', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{strategy.summary}</p>
            </div>
          )}

          {/* Tradeoffs */}
          {tradeoffs.length > 0 && (
            <div className="content-section">
              <div className="section-toolbar">
                <h2>Rehost vs Replatform vs Refactor Trade-Offs</h2>
                <SlidersHorizontal size={18} color="var(--teal-600)" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {tradeoffs.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      padding: 16,
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {titleCase(item.option)}
                      </strong>
                      <span className="tag">{item.fit}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <strong style={{ display: 'block', color: 'var(--status-success-text)', marginBottom: 4 }}>+ Benefits:</strong>
                      {item.benefits?.map((b) => <p key={b} style={{ margin: '2px 0' }}>• {b}</p>)}
                      <strong style={{ display: 'block', color: 'var(--status-danger-text)', marginTop: 8, marginBottom: 4 }}>− Drawbacks:</strong>
                      {item.drawbacks?.map((d) => <p key={d} style={{ margin: '2px 0' }}>• {d}</p>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technology Upgrades */}
          {upgrades.length > 0 && (
            <div className="content-section">
              <div className="section-toolbar">
                <h2>Technology & Dependency Upgrades</h2>
                <span className="mono" style={{ fontSize: '0.74rem' }}>{upgrades.length} upgrades identified</span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Current Version</th>
                      <th>Recommended Target</th>
                      <th>Upgrade Priority</th>
                      <th>Architectural Rationale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upgrades.map((u, i) => (
                      <tr key={i}>
                        <td className="mono">{u.current}</td>
                        <td className="mono" style={{ color: 'var(--cyan-600)', fontWeight: 700 }}>{u.recommended}</td>
                        <td>
                          <span className={`severity-pill ${severityClass(u.priority)}`}>
                            {u.priority}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>{u.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function parseSection(item) {
  if (!item) return [];
  try {
    return JSON.parse(item.summary);
  } catch {
    return [];
  }
}

/* ──────────────────── 8. MIGRATION ROADMAP ──────────────────── */
function Roadmap({ recommendations }) {
  const raw = recommendations?.recommendations?.find((item) => item.category === 'migration_roadmap');
  const roadmap = parseSection(raw);

  if (!roadmap.length) {
    return (
      <EmptyState
        title="Migration roadmap unavailable"
        message="Generate AI recommendations to populate the phased migration execution roadmap."
      />
    );
  }

  return (
    <>
      <SectionHeader
        eyebrow="Execution Architecture"
        title="Phased Migration Roadmap"
        description="Structured execution phases with prioritized objectives, exit criteria, dependencies, and risks."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {roadmap
          .sort((a, b) => a.phase - b.phase)
          .map((phase) => (
            <div key={phase.phase} className="content-section" style={{ padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: 'var(--teal-900)',
                    color: '#ffffff',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                  }}
                >
                  {phase.phase}
                </div>
                <div>
                  <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--teal-600)', textTransform: 'uppercase' }}>
                    Phase {phase.phase} Execution
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>{phase.name}</h3>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                <RoadmapBlock label="Objectives" items={phase.objectives} />
                <RoadmapBlock label="Exit Criteria" items={phase.exit_criteria} />
                <RoadmapBlock label="Dependencies" items={phase.dependencies} />
                <RoadmapBlock label="Risks & Mitigations" items={phase.risks} />
              </div>
            </div>
          ))}
      </div>
    </>
  );
}

function RoadmapBlock({ label, items }) {
  return (
    <div style={{ backgroundColor: 'var(--bg-surface-elevated)', padding: 12, borderRadius: 'var(--radius-sm)' }}>
      <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </span>
      {items?.length ? (
        items.map((it, idx) => (
          <p key={idx} style={{ margin: '3px 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            • {it}
          </p>
        ))
      ) : (
        <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
          None listed
        </span>
      )}
    </div>
  );
}

/* ──────────────────── 9. ENGINEERING REPORTS (NEW) ──────────────────── */
function Reports({ assessment, readiness, risks, recommendations }) {
  const [copied, setCopied] = useState(false);

  const exportJSON = () => {
    const data = {
      assessment,
      readiness,
      risks,
      recommendations,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ModernizeAI-Report-${assessment.application_name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyMarkdownSummary = () => {
    const summaryText = `# ModernizeAI Executive Engineering Dossier
Application: ${assessment.application_name}
Archive: ${assessment.original_filename}
Assessment UUID: ${assessment.id}
Date: ${new Date(assessment.created_at).toLocaleDateString()}

## Cloud Readiness Index (CRS)
Overall Score: ${readiness?.overall_score ?? 'Pending'}/100
Formula: ${readiness?.formula ?? 'N/A'}

## Evidence Findings
Total Findings: ${assessment.findings?.length || 0}
Risk Flags: ${Array.isArray(risks) ? risks.length : 0}

## Technologies Detected
Frameworks: ${(assessment.source_summary?.frameworks || []).join(', ') || 'None'}
Databases: ${(assessment.source_summary?.databases || []).join(', ') || 'None'}
`;
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <SectionHeader
        eyebrow="Formal Assessment Report"
        title="Executive Engineering Dossier"
        description="Comprehensive audit report compiling static discovery, deterministic CRS evaluation, and migration plans."
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="button button--secondary" onClick={copyMarkdownSummary}>
              {copied ? <Check size={15} color="#12a26b" /> : <Copy size={15} />}
              <span>{copied ? 'Copied Markdown' : 'Copy Markdown'}</span>
            </button>
            <button className="button button--secondary" onClick={exportJSON}>
              <FileDown size={15} />
              <span>Export JSON</span>
            </button>
            <button className="button button--primary" onClick={handlePrint}>
              <Printer size={15} />
              <span>Print Dossier</span>
            </button>
          </div>
        }
      />

      <div className="content-section" style={{ padding: 32 }}>
        <div style={{ borderBottom: '2px solid var(--border-subtle)', paddingBottom: 20, marginBottom: 24 }}>
          <span className="section-eyebrow">ModernizeAI Formal Technical Report</span>
          <h2 style={{ fontSize: '1.8rem', margin: '6px 0 8px', color: 'var(--text-primary)' }}>
            Application Modernization Dossier: {assessment.application_name}
          </h2>
          <div style={{ display: 'flex', gap: 20, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>Assessment ID: <strong className="mono">{assessment.id}</strong></span>
            <span>Date: {formatDate(assessment.created_at)}</span>
            <span>Status: <StatusBadge status={assessment.status} /></span>
          </div>
        </div>

        {/* Executive Summary Section */}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--teal-900)', marginBottom: 8 }}>
            1. Executive Modernization Assessment Summary
          </h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.88rem' }}>
            The application archive <code className="mono">{assessment.original_filename}</code> was ingested and analyzed
            using the ModernizeAI static analysis engine. A total of{' '}
            <strong>{assessment.source_summary?.analyzed_files ?? assessment.findings?.length}</strong> files were evaluated.
            The deterministic Cloud Readiness Score is evaluated at{' '}
            <strong>{readiness ? `${readiness.overall_score}/100` : 'Pending'}</strong>.
          </p>
        </div>

        {/* Tech Stack Summary Table */}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--teal-900)', marginBottom: 12 }}>
            2. Technology & Manifest Inventory
          </h3>
          <div className="table-wrap">
            <table>
              <tbody>
                <tr>
                  <th style={{ width: 220 }}>Framework Stack</th>
                  <td>{(assessment.source_summary?.frameworks || []).join(', ') || 'No framework detected'}</td>
                </tr>
                <tr>
                  <th>Database Integrations</th>
                  <td>{(assessment.source_summary?.databases || []).join(', ') || 'No database drivers detected'}</td>
                </tr>
                <tr>
                  <th>Java Runtimes Identified</th>
                  <td>{(assessment.source_summary?.java_versions || []).join(', ') || 'N/A'}</td>
                </tr>
                <tr>
                  <th>Configuration Descriptors</th>
                  <td>{(assessment.source_summary?.configuration_files || []).join(', ') || 'N/A'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Cloud Readiness Breakdown */}
        {readiness && (
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--teal-900)', marginBottom: 12 }}>
              3. Cloud Readiness Index (CRS) Pillar Breakdown
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
              <ReportScoreCard label="Technology" score={readiness.technology_score} weight="25%" />
              <ReportScoreCard label="Data" score={readiness.data_score} weight="20%" />
              <ReportScoreCard label="Security" score={readiness.security_score} weight="20%" />
              <ReportScoreCard label="Architecture" score={readiness.architecture_score} weight="20%" />
              <ReportScoreCard label="Compliance" score={readiness.compliance_score} weight="15%" />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function ReportScoreCard({ label, score, weight }) {
  return (
    <div style={{ padding: 14, backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
        <span>{label}</span>
        <span>{weight}</span>
      </div>
      <strong style={{ fontSize: '1.3rem', color: 'var(--text-primary)', display: 'block', marginTop: 4 }}>
        {score ?? '—'}
      </strong>
    </div>
  );
}
