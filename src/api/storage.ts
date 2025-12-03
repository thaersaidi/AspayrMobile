import { apiClient } from './client';

/**
 * CosmosDB storage API endpoints
 */

export const storageApi = {
  /**
   * Save onboarding quiz data
   */
  async saveOnboardingData(
    userId: string,
    quizData: {
      quizAnswers: any;
      completedAt: string;
      quizVersion: string;
      username: string;
    }
  ): Promise<void> {
    return apiClient.post(`/api/onboarding/${userId}`, quizData);
  },

  /**
   * Get onboarding quiz data
   */
  async getOnboardingData(userId: string): Promise<{ data?: any; quizAnswers?: any } | null> {
    try {
      return await apiClient.get(`/api/onboarding/${userId}`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Get accounts from CosmosDB
   */
  async getAccounts(userId: string): Promise<any[]> {
    try {
      return await apiClient.get(`/api/accounts/${userId}`);
    } catch (error) {
      console.error('[API] Failed to fetch accounts:', error);
      return [];
    }
  },

  /**
   * Get transactions from CosmosDB
   */
  async getTransactions(userId: string): Promise<any[]> {
    try {
      const response = await apiClient.get<{ transactions?: any[] }>(
        `/api/transactions/${userId}`
      );
      return response.transactions || [];
    } catch (error) {
      console.error('[API] Failed to fetch transactions:', error);
      return [];
    }
  },

  /**
   * Get balances for a specific account from CosmosDB
   */
  async getBalancesForAccount(
    userId: string,
    accountId: string
  ): Promise<any> {
    try {
      return await apiClient.get(`/api/balances/${userId}/${accountId}`);
    } catch (error) {
      console.error('[API] Failed to fetch balances:', error);
      return { unavailable: true };
    }
  },

  /**
   * Trigger a refresh of bank data from Yapily API (background fetch)
   */
  async refreshBankData(userUuid: string): Promise<void> {
    try {
      await apiClient.get(
        `/api/yapily/account-auth-requests?userUuid=${userUuid}`
      );
    } catch (error) {
      console.error('[API] Failed to trigger bank data refresh:', error);
      throw error;
    }
  },

  /**
   * Get budgets from CosmosDB
   */
  async getBudgets(userId: string): Promise<any[]> {
    try {
      const response = await apiClient.get<{ data?: any[] }>(
        `/api/budgets?userId=${userId}`
      );
      return response.data || [];
    } catch (error) {
      console.error('[API] Failed to fetch budgets:', error);
      return [];
    }
  },

  /**
   * Save a single budget to CosmosDB
   */
  async saveBudget(userId: string, budgetData: any): Promise<void> {
    return apiClient.post('/api/budgets', { userId, ...budgetData });
  },

  /**
   * Save multiple budgets to CosmosDB
   */
  async saveBudgetsBulk(userId: string, budgets: any[]): Promise<void> {
    return apiClient.post('/api/budgets/bulk', { userId, budgets });
  },

  /**
   * Delete a budget from CosmosDB
   */
  async deleteBudget(userId: string, budgetId: string): Promise<void> {
    return apiClient.delete(`/api/budgets/${budgetId}?userId=${userId}`);
  },
};
