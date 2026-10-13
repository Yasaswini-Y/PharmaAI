import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { UploadPage } from './pages/UploadPage.jsx';

const { uploadApplication } = vi.hoisted(() => ({ uploadApplication: vi.fn() }));

vi.mock('./api/modernize.js', () => ({
  uploadApplication,
  apiErrorMessage: vi.fn((error) => error?.message || 'request failed'),
}));

test('opens the returned assessment after a successful real upload response', async () => {
  const assessment = { id: 'assessment-1', application_name: 'Fixture' };
  uploadApplication.mockResolvedValueOnce({ assessment });
  const onCreated = vi.fn();
  const file = new File(['PK\u0003\u0004'], 'fixture.zip', { type: 'application/zip' });

  render(<UploadPage onCreated={onCreated} />);
  fireEvent.change(screen.getByLabelText('Application name'), { target: { value: 'Fixture' } });
  fireEvent.change(document.querySelector('input[type="file"]'), { target: { files: [file] } });
  fireEvent.click(screen.getByRole('button', { name: /start analysis/i }));

  await waitFor(() => expect(onCreated).toHaveBeenCalledWith(assessment));
});

test('shows an explicit error when the upload response has no assessment id', async () => {
  uploadApplication.mockResolvedValueOnce({});
  const onCreated = vi.fn();
  const file = new File(['PK\u0003\u0004'], 'fixture.zip', { type: 'application/zip' });

  render(<UploadPage onCreated={onCreated} />);
  fireEvent.change(document.querySelector('input[type="file"]'), { target: { files: [file] } });
  fireEvent.click(screen.getByRole('button', { name: /start analysis/i }));

  expect(await screen.findByText(/returned no assessment identifier/i)).toBeInTheDocument();
  expect(onCreated).not.toHaveBeenCalled();
});
