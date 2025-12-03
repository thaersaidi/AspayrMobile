// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.API_BASE_URL || 'https://api.aspayr.com',
  TIMEOUT: 30000,
};

// Storage Keys
export const STORAGE_KEYS = {
  USER: 'aspayr_user',
  THEME: 'aspayr_theme',
  CHAT_MESSAGES: 'aspayr_chat_messages',
  CONSENT_TOKENS: 'aspayr_consent_tokens_by_user',
  ONBOARDING_COMPLETED: 'aspayr_onboarding_completed',
  BIOMETRIC_ENABLED: 'aspayr_biometric_enabled',
};

// Keychain Keys (Secure Storage)
export const KEYCHAIN_KEYS = {
  PIN: 'aspayr_pin',
  ACCESS_TOKEN: 'aspayr_access_token',
  REFRESH_TOKEN: 'aspayr_refresh_token',
};

// Navigation Routes
export const ROUTES = {
  // Auth Stack
  WELCOME: 'Welcome',
  LOGIN: 'Login',
  REGISTER: 'Register',
  PIN_SETUP: 'PINSetup',

  // Main Stack
  DASHBOARD: 'Dashboard',
  ACCOUNTS: 'Accounts',
  INSIGHTS: 'Insights',
  PAYMENTS: 'Payments',
  PROFILE: 'Profile',

  // Modals
  LINK_BANK: 'LinkBank',
  CHAT: 'Chat',
  ONBOARDING_QUIZ: 'OnboardingQuiz',
  GUIDED_TOUR: 'GuidedTour',
  TRANSACTION_DETAIL: 'TransactionDetail',
};

// AI Agents
export const AI_AGENTS = {
  ROUTER: 'agent-router-v1',
  ACCOUNT_INSIGHTS: 'agent-001',
  ONBOARDING: 'agent-identity-onboarding-v1',
};

// Feature Flags
export const FEATURES = {
  BIOMETRIC_AUTH: true,
  PUSH_NOTIFICATIONS: false,
  OFFLINE_MODE: true,
  RECEIPT_SCANNING: false,
};
