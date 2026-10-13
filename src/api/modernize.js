import { apiClient } from './client.js';

const unwrap = (request) => request.then((response) => response.data);
export const getAssessments = (params) => unwrap(apiClient.get('/assessments', { params }));
export const getAssessment = (id) => unwrap(apiClient.get(`/assessments/${id}`));
export const getReadiness = (id) => unwrap(apiClient.get(`/assessments/${id}/readiness`));
export const getRisks = (id) => unwrap(apiClient.get(`/assessments/${id}/risks`)).then((data) => Array.isArray(data) ? data : data?.items || data?.data || []);
export async function fetchRisks(id) {
  const response = await apiClient.get(`/assessments/${id}/risks`);
  const data = response.data;
  return Array.isArray(data) ? data : data?.items || data?.data || [];
}
export const getDependencies = (id) => unwrap(apiClient.get(`/assessments/${id}/dependencies`));
export const getImpact = (id, target) => unwrap(apiClient.get(`/assessments/${id}/impact`, { params: { target } }));
export const getRecommendations = (id) => unwrap(apiClient.get(`/assessments/${id}/recommendations`));
export const generateRecommendations = (id) => unwrap(apiClient.post(`/assessments/${id}/recommendations/generate`));

export function uploadApplication(file, applicationName, onUploadProgress) {
  const body = new FormData();
  body.append('file', file);
  if (applicationName?.trim()) body.append('application_name', applicationName.trim());
  return unwrap(apiClient.post('/applications/upload', body, { headers: { 'Content-Type': 'multipart/form-data' }, onUploadProgress }));
}

export function apiErrorMessage(error) {
  return error?.response?.data?.detail || error?.message || 'The backend request failed.';
}

