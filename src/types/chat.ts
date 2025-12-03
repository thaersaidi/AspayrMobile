export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agentName?: string;
}

export interface ChatState {
  messages: Message[];
  loading: boolean;
  error: string | null;
}

export interface SendMessageParams {
  question: string;
  agentName?: string;
}

export interface ChatAPIResponse {
  reply: string;
  raw?: any;
}

export interface ChatRoutingResponse {
  routing: {
    selected_agent: string;
    reasoning: string;
    confidence: number;
    data_required: string[];
  };
  raw_response?: any;
}

export const AI_AGENTS = {
  ROUTER: 'agent-router-v1',
  IDENTITY_ONBOARDING: 'agent-identity-onboarding-v1',
  FINANCE_PLANNER: 'agent-finance-planner-v1',
  SPEND_ANALYST: 'agent-spend-analyst-v1',
  FORECAST_GUIDE: 'agent-forecast-guide-v1',
  SUPPORT_DESK: 'agent-support-desk-v1',
  ACCOUNT_INSIGHTS: 'agent-001',
} as const;

export const AGENT_LABELS = {
  [AI_AGENTS.ROUTER]: 'All (Router)',
  [AI_AGENTS.IDENTITY_ONBOARDING]: 'Identity & Onboarding',
  [AI_AGENTS.FINANCE_PLANNER]: 'Finance Planner',
  [AI_AGENTS.SPEND_ANALYST]: 'Spend Analyst',
  [AI_AGENTS.FORECAST_GUIDE]: 'Forecast Guide',
  [AI_AGENTS.SUPPORT_DESK]: 'Support Desk',
  [AI_AGENTS.ACCOUNT_INSIGHTS]: 'Account Insights',
} as const;
