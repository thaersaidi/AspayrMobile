/**
 * Central API export
 */

export { apiClient } from './client';
export { authApi } from './auth';
export { bankingApi } from './banking';
export { storageApi } from './storage';
export { aiApi } from './ai';

// Re-export for convenience
export const api = {
  auth: require('./auth').authApi,
  banking: require('./banking').bankingApi,
  storage: require('./storage').storageApi,
  ai: require('./ai').aiApi,
};
