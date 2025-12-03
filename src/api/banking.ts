import { apiClient } from './client';
import {
  Institution,
  Account,
  Transaction,
  Balance,
  AuthRequest,
} from '../types/banking';

/**
 * Banking API endpoints (Yapily integration)
 */

export const bankingApi = {
  /**
   * Get list of institutions
   */
  async getInstitutions(): Promise<{ institutions: Institution[] }> {
    const data = await apiClient.get<any>('/api/yapily/institutions');
    const instList = data.institutions || data;
    return { institutions: Array.isArray(instList) ? instList : instList.data || [] };
  },

  /**
   * Start account authorization (OAuth flow)
   */
  async startAccountAuth(params: {
    institutionId: string;
    userUuid: string;
    psuId?: string;
    psuIpAddress?: string;
    psuUserAgent?: string;
  }): Promise<{ data: AuthRequest }> {
    return apiClient.post('/api/yapily/account-auth-requests', params);
  },

  /**
   * Start embedded account authorization
   */
  async startEmbeddedAccountAuth(params: {
    institutionId: string;
    userUuid: string;
    psuId: string;
    psuIpAddress?: string;
    psuUserAgent?: string;
    userCredentials: {
      id: string;
      password: string;
    };
  }): Promise<{ data: AuthRequest }> {
    return apiClient.post('/api/yapily/embedded-account-auth-requests', params);
  },

  /**
   * Get list of authorization requests for user
   */
  async getAuthRequests(userUuid: string): Promise<{ data: AuthRequest[] }> {
    return apiClient.get(
      `/api/yapily/account-auth-requests?userUuid=${encodeURIComponent(userUuid)}`
    );
  },

  /**
   * Get consent status
   */
  async getConsentStatus(consentId: string): Promise<{ data: any }> {
    return apiClient.get(`/api/yapily/consents/${consentId}`);
  },

  /**
   * Delete consent
   */
  async deleteConsent(consentId: string): Promise<void> {
    return apiClient.delete(`/api/yapily/consents/${consentId}`);
  },

  /**
   * Get accounts for a consent token
   */
  async getAccounts(consentToken: string): Promise<{ data: Account[] }> {
    return apiClient.get(
      `/api/yapily/accounts?consentToken=${encodeURIComponent(consentToken)}`
    );
  },

  /**
   * Get balances for an account
   */
  async getBalances(
    accountId: string,
    consentToken: string
  ): Promise<{ data: { balances: Balance[] } }> {
    return apiClient.get(
      `/api/yapily/accounts/${accountId}/balances?consentToken=${encodeURIComponent(consentToken)}`
    );
  },

  /**
   * Get transactions for an account
   */
  async getTransactions(
    accountId: string,
    consentToken: string
  ): Promise<{ data: Transaction[] }> {
    return apiClient.get(
      `/api/yapily/accounts/${accountId}/transactions?consentToken=${encodeURIComponent(consentToken)}`
    );
  },

  /**
   * Start payment authorization
   */
  async startPaymentAuth(params: {
    institutionId: string;
    userUuid: string;
    paymentRequest: {
      paymentIdempotencyId: string;
      type: string;
      amount: {
        amount: number;
        currency: string;
      };
      reference: string;
      payee: {
        name: string;
        accountIdentifications: Array<{
          type: string;
          identification: string;
        }>;
      };
    };
    psuId?: string;
    psuIpAddress?: string;
    psuUserAgent?: string;
  }): Promise<{ data: any }> {
    return apiClient.post('/api/yapily/payment-auth-requests', params);
  },

  /**
   * Get payment consent status
   */
  async getPaymentConsentStatus(paymentConsentId: string): Promise<{ data: any }> {
    return apiClient.get(`/api/yapily/payment-consents/${paymentConsentId}`);
  },

  /**
   * Execute payment
   */
  async executePayment(params: {
    consentToken: string;
    paymentConsentId: string;
  }): Promise<{ data: any }> {
    return apiClient.post('/api/yapily/payments', params);
  },
};
