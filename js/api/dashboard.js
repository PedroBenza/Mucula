import { apiRequest } from './client.js';
import { isLocalMode } from '../config.js';
import { localDashboard } from '../local/store.js';

export async function fetchMyDashboard() {
  if (isLocalMode()) return localDashboard();
  return apiRequest('/dashboard/mine');
}
