import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import App from './App.jsx';

vi.mock('./api/health.js', () => ({ getHealth: vi.fn(() => Promise.resolve({ status: 'ok' })) }));
vi.mock('./api/modernize.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, getAssessments: vi.fn(() => Promise.resolve({ items: [], total: 0 })) };
});
vi.mock('./contexts/AuthContext.jsx', () => ({
  useAuth: vi.fn(() => ({
    user: { email: 'architect@modernize.ai' },
    loading: false,
    signOut: vi.fn(),
  })),
  AuthProvider: ({ children }) => children,
}));

test('renders the ModernizeAI workspace and empty portfolio state', async () => {
  window.location.hash = '#/dashboard';
  render(<App />);
  expect(screen.getByText('ModernizeAI')).toBeInTheDocument();
  expect(await screen.findByText('No repositories assessed yet')).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: /new assessment/i })).toHaveLength(2);
});
