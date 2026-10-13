import { apiClient } from './client.js';

export async function getHealth() {
  const response = await apiClient.get('/health');
  return response.data;
}

