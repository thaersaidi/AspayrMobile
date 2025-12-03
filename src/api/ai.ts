import { apiClient } from './client';

/**
 * AI Chat API endpoints (Azure AI)
 */

export const aiApi = {
  /**
   * Send chat message to AI agent
   */
  async chat(params: {
    question: string;
    history: Array<{ role: string; content: string }>;
    agentName: string;
  }): Promise<{ reply: string }> {
    return apiClient.post('/api/ai/chat', params);
  },

  /**
   * Send chat message with account context (agent-001)
   */
  async chatPlus(params: {
    question: string;
    history: Array<{ role: string; content: string }>;
    agentName: string;
    account?: any;
    transactions?: any[];
    balances?: any;
  }): Promise<{ reply: string }> {
    return apiClient.post('/api/ai/chatplus', params);
  },

  /**
   * Route message to appropriate agent
   */
  async chatRoute(params: {
    question: string;
    history: Array<{ role: string; content: string }>;
  }): Promise<{ routing: { selected_agent: string; reasoning: string } }> {
    return apiClient.post('/api/ai/chat-route', params);
  },
};
