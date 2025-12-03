import { apiClient } from './client';
import { User, LoginCredentials, RegisterCredentials } from '../types/auth';

/**
 * Authentication API endpoints
 */

export const authApi = {
  /**
   * Create or login user (Yapily)
   */
  async createOrLoginUser(
    username: string,
    password: string
  ): Promise<{ userUuid: string; user: any }> {
    return apiClient.post('/api/yapily/user', { username, password });
  },

  /**
   * Register new user
   */
  async register(credentials: RegisterCredentials): Promise<User> {
    return apiClient.post('/api/yapily/user', {
      ...credentials,
      mode: 'register',
    });
  },

  /**
   * Get user by UUID
   */
  async getUser(userUuid: string): Promise<{ user: any }> {
    return apiClient.get(`/api/yapily/user/${userUuid}`);
  },

  /**
   * Reset password
   */
  async resetPassword(username: string): Promise<void> {
    return apiClient.post('/api/yapily/user/reset', { username });
  },

  /**
   * Check if user exists by username
   */
  async checkUserExists(username: string): Promise<{ exists: boolean; userUuid?: string }> {
    return apiClient.get(
      `/api/yapily/user/check?username=${encodeURIComponent(username)}`
    );
  },

  /**
   * Check PIN status
   */
  async checkPinStatus(userUuid: string): Promise<{ hasPin: boolean }> {
    return apiClient.get(`/api/users/${userUuid}/pin-status`);
  },

  /**
   * Create PIN
   */
  async createPin(
    userUuid: string,
    pin: string,
    username?: string
  ): Promise<void> {
    return apiClient.post(`/api/users/${userUuid}/pin`, { pin, username });
  },

  /**
   * Verify PIN
   * Note: Backend returns { success: true } on success, throws error on failure
   */
  async verifyPin(
    userUuid: string,
    pin: string
  ): Promise<{ success: boolean; message?: string; userUuid?: string }> {
    return apiClient.post(`/api/users/${userUuid}/verify-pin`, { pin });
  },

  /**
   * Get user data
   */
  async getUserData(userUuid: string): Promise<{ data: any }> {
    return apiClient.get(`/api/users/${userUuid}`);
  },
};
