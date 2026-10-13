import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { AssessmentPage, Overview, Risks } from './pages/AssessmentPage.jsx';

vi.mock('./api/modernize.js', () => ({
  getAssessment: vi.fn(() => Promise.resolve({
    id: 'assessment-1',
    application_name: 'Fixture',
    original_filename: 'fixture.zip',
    status: 'completed',
    created_at: '2026-10-12T18:20:13.391618Z',
    source_summary: {},
    findings: [],
  })),
  getReadiness: vi.fn(() => Promise.resolve({
    overall_score: 72,
    technology_score: 100,
    data_score: 50,
    security_score: 63,
    architecture_score: 85,
    compliance_score: 50,
    formula: 'CRS = 0.25T + 0.20D + 0.20S + 0.20A + 0.15C',
    unknowns: [{ factor: 'D', score: 50, reason: 'No database references were detected.' }],
    deductions: [],
  })),
  getRisks: vi.fn(() => Promise.resolve([{
    id: 'risk-1',
    category: 'security',
    severity: 'medium',
    title: 'Plain HTTP reference detected.',
    description: 'Review required.',
    evidence_refs: [{ rule_id: 'SEC-003' }],
  }])),
  fetchRisks: vi.fn(() => Promise.resolve([{
    id: 'risk-1',
    category: 'security',
    severity: 'medium',
    title: 'Plain HTTP reference detected.',
    description: 'Review required.',
    evidence_refs: [{ rule_id: 'SEC-003' }],
  }])),
  getDependencies: vi.fn(() => Promise.resolve({ nodes: [], edges: [] })),
  getRecommendations: vi.fn(() => Promise.resolve({ recommendations: [] })),
  getImpact: vi.fn(),
  generateRecommendations: vi.fn(),
  apiErrorMessage: vi.fn((error) => error?.message || 'request failed'),
}));

test('renders the risks view from persisted risk records', async () => {
  render(<AssessmentPage assessmentId="assessment-1" view="risks" />);
  expect(await screen.findByText('Risks and pharma review')).toBeInTheDocument();
});

test('renders a persisted risk record in the risk register', () => {
  render(<Risks risks={[{
    id: 'risk-1',
    category: 'security',
    severity: 'medium',
    title: 'Plain HTTP reference detected.',
    description: 'Review required.',
    rule_id: 'SEC-003',
    evidence_refs: [{ rule_id: 'SEC-003' }],
  }]} />);
  expect(screen.getByText('Plain HTTP reference detected.')).toBeInTheDocument();
  expect(screen.getByText('SEC-003 · 1 evidence reference(s)')).toBeInTheDocument();
});

test('does not crash overview when risk response is not an array', () => {
  render(<Overview
    assessment={{ application_name: 'Fixture', source_summary: {}, findings: [] }}
    readiness={null}
    risks={{ overall_score: 72 }}
  />);
  expect(screen.getByText('Assessment overview')).toBeInTheDocument();
  expect(screen.getAllByText('0')).toHaveLength(2);
});
