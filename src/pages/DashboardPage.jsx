import { useState, useMemo } from 'react';
import {
  ArrowRight,
  Database,
  FileArchive,
  Filter,
  Plus,
  Search,
  ShieldAlert,
  TrendingUp,
  FileText,
  Copy,
  Check,
  Cpu
} from 'lucide-react';
import { navigate } from '../App.jsx';
import { EmptyState, ErrorState } from '../components/States.jsx';
import { MetricCard } from '../components/MetricCard.jsx';
import { SectionHeader } from '../components/SectionHeader.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { formatDate, formatBytes } from '../utils/format.js';

export function DashboardPage({ assessments, error, onOpen }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'completed' | 'analyzing' | 'failed'
  const [scoreTier, setScoreTier] = useState('all'); // 'all' | 'high' | 'medium' | 'low'
  const [copiedId, setCopiedId] = useState('');

  const complete = useMemo(
    () => assessments.filter((item) => item.status === 'completed'),
    [assessments]
  );

  const averageScore = useMemo(() => {
    const scored = complete.filter((item) => typeof item.cloud_readiness_score === 'number');
    if (!scored.length) return null;
    return Math.round(scored.reduce((sum, item) => sum + item.cloud_readiness_score, 0) / scored.length);
  }, [complete]);

  const totalFindings = useMemo(
    () => assessments.reduce((sum, item) => sum + (item.findings?.length || 0), 0),
    [assessments]
  );

  const flaggedRepositories = useMemo(
    () => complete.filter((item) => (item.source_summary?.unsupported_file_count || 0) > 0).length,
    [complete]
  );

  // Filtered list
  const filteredAssessments = useMemo(() => {
    return assessments.filter((item) => {
      // Search
      const matchesSearch =
        !searchTerm.trim() ||
        item.application_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.original_filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id?.toLowerCase().includes(searchTerm.toLowerCase());

      // Status
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

      // Score tier
      let matchesScore = true;
      if (scoreTier !== 'all') {
        const score = item.cloud_readiness_score;
        if (typeof score !== 'number') {
          matchesScore = false;
        } else if (scoreTier === 'high') {
          matchesScore = score >= 70;
        } else if (scoreTier === 'medium') {
          matchesScore = score >= 40 && score < 70;
        } else if (scoreTier === 'low') {
          matchesScore = score < 40;
        }
      }

      return matchesSearch && matchesStatus && matchesScore;
    });
  }, [assessments, searchTerm, statusFilter, scoreTier]);

  const copyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  return (
    <div className="page-stack">
      <SectionHeader
        eyebrow="Portfolio Command Center"
        title="Modernization Portfolio & Inventory"
        description="Comprehensive repository inventory, deterministic cloud readiness metrics, and migration directives across analyzed assets."
        action={
          <button className="button button--primary" onClick={() => navigate('/upload')}>
            <Plus size={16} />
            <span>New assessment</span>
          </button>
        }
      />

      {/* KPI Metric Strip */}
      <div className="metric-grid">
        <MetricCard
          label="Repositories Assessed"
          value={assessments.length}
          detail="Persisted archives in database"
          tone="blue"
          icon={FileArchive}
        />
        <MetricCard
          label="Portfolio Mean CRS"
          value={averageScore !== null ? `${averageScore}/100` : '—'}
          detail={averageScore !== null ? 'Cloud readiness across completed' : 'Awaiting completed runs'}
          tone="green"
          icon={TrendingUp}
        />
        <MetricCard
          label="Verified Code Findings"
          value={totalFindings}
          detail="AST & static rules triggered"
          tone="amber"
          icon={Cpu}
        />
        <MetricCard
          label="Special Handling Flags"
          value={flaggedRepositories}
          detail="Repositories with unsupported files"
          tone="blue"
          icon={ShieldAlert}
        />
      </div>

      {/* Inventory Section */}
      <section className="content-section">
        <div className="section-toolbar" style={{ flexWrap: 'wrap', gap: 14 }}>
          <div className="section-toolbar-left">
            <h2>Application Inventory & Analysis History</h2>
            <p>Direct inspection of ingested codebases, cloud migration readiness, and evidence payloads.</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', width: 220 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search repositories…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                height: 34,
                padding: '0 10px',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="analyzing">Analyzing</option>
              <option value="failed">Failed</option>
            </select>

            {/* Score Tier Filter */}
            <select
              value={scoreTier}
              onChange={(e) => setScoreTier(e.target.value)}
              style={{
                height: 34,
                padding: '0 10px',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              <option value="all">All Readiness Tiers</option>
              <option value="high">High Readiness (≥70)</option>
              <option value="medium">Moderate Readiness (40-69)</option>
              <option value="low">Legacy / High Friction (&lt;40)</option>
            </select>

            <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              {filteredAssessments.length} matching
            </span>
          </div>
        </div>

        {error ? (
          <ErrorState message={error} />
        ) : filteredAssessments.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Application / Service</th>
                  <th>Archive Details</th>
                  <th>Analysis Status</th>
                  <th>Cloud Readiness (CRS)</th>
                  <th>Detected Tech Stack</th>
                  <th>Analyzed Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssessments.map((item) => {
                  const frameworks = item.source_summary?.frameworks || [];
                  const databases = item.source_summary?.databases || [];
                  const score = item.cloud_readiness_score;

                  return (
                    <tr key={item.id}>
                      <td>
                        <button
                          className="table-link"
                          onClick={() => onOpen(item.id)}
                          style={{ fontSize: '0.88rem', fontWeight: 700 }}
                        >
                          {item.application_name}
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                          <span className="mono">{item.id.slice(0, 8)}…</span>
                          <button
                            className="icon-btn"
                            style={{ width: 18, height: 18, padding: 0 }}
                            onClick={() => copyId(item.id)}
                            title="Copy UUID"
                          >
                            {copiedId === item.id ? <Check size={11} color="#12a26b" /> : <Copy size={11} />}
                          </button>
                        </div>
                      </td>
                      <td>
                        <strong style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                          {item.original_filename}
                        </strong>
                        <span className="mono" style={{ fontSize: '0.72rem' }}>
                          {item.application?.file_count ? `${item.application.file_count} files` : 'ZIP Archive'}
                          {item.application?.compressed_size_bytes && ` · ${formatBytes(item.application.compressed_size_bytes)}`}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td>
                        {typeof score === 'number' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div
                              style={{
                                width: 50,
                                height: 6,
                                backgroundColor: 'var(--bg-surface-sunken)',
                                borderRadius: 3,
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width: `${Math.min(100, Math.max(0, score))}%`,
                                  height: '100%',
                                  backgroundColor: score >= 70 ? 'var(--cyan-600)' : score >= 40 ? '#f5a524' : '#e5484d',
                                }}
                              />
                            </div>
                            <strong style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                              {score}/100
                            </strong>
                          </div>
                        ) : (
                          <span className="mono" style={{ color: 'var(--text-tertiary)' }}>Not computed</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 220 }}>
                          {frameworks.slice(0, 2).map((fw) => (
                            <span key={fw} className="tag" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>{fw}</span>
                          ))}
                          {databases.slice(0, 1).map((db) => (
                            <span key={db} className="tag" style={{ fontSize: '0.68rem', padding: '1px 6px', backgroundColor: 'var(--bg-surface-elevated)' }}>{db}</span>
                          ))}
                          {frameworks.length === 0 && databases.length === 0 && (
                            <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>No frameworks detected</span>
                          )}
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '0.78rem' }}>{formatDate(item.created_at)}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            className="button button--secondary button--small"
                            onClick={() => onOpen(item.id)}
                            title="Open Analysis Workspace"
                          >
                            <span>Inspect</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={searchTerm || statusFilter !== 'all' || scoreTier !== 'all' ? 'No matching assessments' : 'No repositories assessed yet'}
            message={
              searchTerm || statusFilter !== 'all' || scoreTier !== 'all'
                ? 'Try clearing your filters or search keywords.'
                : 'Upload a ZIP repository archive to trigger deterministic static analysis, cloud readiness scoring, and dependency impact analysis.'
            }
            action={
              <button className="button button--secondary" onClick={() => navigate('/upload')}>
                <Plus size={16} />
                <span>Upload repository</span>
              </button>
            }
          />
        )}
      </section>
    </div>
  );
}
