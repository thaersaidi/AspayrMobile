/**
 * Central API export
 */

export { apiClient } from './client';
export { authApi } from './auth';
export { bankingApi } from './banking';
export { storageApi } from './storage';
export { aiApi } from './ai';

import { authApi } from './auth';
import { bankingApi } from './banking';
import { storageApi } from './storage';
import { aiApi } from './ai';

// Re-export for convenience
export const api = {
  auth: authApi,
  banking: bankingApi,
  storage: storageApi,
  ai: aiApi,
};
