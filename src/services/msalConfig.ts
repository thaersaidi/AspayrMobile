import { Platform } from 'react-native';
import { MSAL_CONFIG } from '../config/msal.config';

// Import MSAL for web platform (will be tree-shaken on native)
let PublicClientApplication: any = null;
if (Platform.OS === 'web') {
  PublicClientApplication = require('@azure/msal-browser').PublicClientApplication;
}

// Helper function to safely get react-native-config (only works on native platforms)
const getNativeConfig = () => {
  if (Platform.OS === 'web') {
    return null;
  }
  try {
    return require('react-native-config').default;
  } catch {
    console.warn('[MSAL] react-native-config not available');
    return null;
  }
};

// Platform-specific config loading
let Config: any = {};
if (Platform.OS === 'web') {
  // On web, use the bundled config file
  Config = {
    MSAL_CLIENT_ID: MSAL_CONFIG.CLIENT_ID,
    MSAL_TENANT_ID: MSAL_CONFIG.TENANT_ID,
    MSAL_AUTHORITY: MSAL_CONFIG.AUTHORITY,
    MSAL_REDIRECT_URI: MSAL_CONFIG.REDIRECT_URI_WEB,
  };
} else {
  // On native, use react-native-config from .env file
  const RNConfig = getNativeConfig();
  Config = {
    MSAL_CLIENT_ID: RNConfig?.MSAL_CLIENT_ID || MSAL_CONFIG.CLIENT_ID,
    MSAL_TENANT_ID: RNConfig?.MSAL_TENANT_ID || MSAL_CONFIG.TENANT_ID,
    MSAL_AUTHORITY: RNConfig?.MSAL_AUTHORITY || MSAL_CONFIG.AUTHORITY,
    MSAL_REDIRECT_URI: RNConfig?.MSAL_REDIRECT_URI || MSAL_CONFIG.REDIRECT_URI_NATIVE,
  };
}

// Get MSAL configuration
const clientId = Config.MSAL_CLIENT_ID || '';
const tenantId = Config.MSAL_TENANT_ID || '';
const authorityEnv = Config.MSAL_AUTHORITY || '';
const redirectUri = Config.MSAL_REDIRECT_URI || (typeof window !== 'undefined' ? window.location.origin : '');

const resolvedAuthority =
  authorityEnv ||
  (tenantId
    ? `https://login.microsoftonline.com/${tenantId}`
    : 'https://login.microsoftonline.com/consumers'); // personal accounts by default

// Debug logging
console.log('[MSAL Config] Loaded configuration:', {
  platform: Platform.OS,
  clientId: clientId ? `${clientId.substring(0, 8)}...` : 'MISSING',
  authority: resolvedAuthority,
  redirectUri: redirectUri,
});

if (!clientId) {
  console.warn('[Auth] MSAL_CLIENT_ID is not set. Microsoft sign-in will be disabled.');
}

export const msalConfig = {
  auth: {
    clientId: clientId || '',
    authority: resolvedAuthority,
    redirectUri,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ['User.Read', 'openid', 'profile', 'email'],
};

// MSAL instance for web platform - lazy loaded
let msalInstance: any = null;
let msalInitPromise: Promise<void> | null = null;

export const initializeMsal = async () => {
  if (Platform.OS !== 'web') {
    return;
  }

  if (msalInstance) {
    return msalInstance;
  }

  try {
    if (!PublicClientApplication) {
      throw new Error('MSAL browser library not loaded');
    }

    msalInstance = new PublicClientApplication(msalConfig as any);
    msalInitPromise = msalInstance.initialize();
    await msalInitPromise;
    console.log('[Auth] MSAL initialized successfully');
    return msalInstance;
  } catch (error) {
    console.error('[Auth] Failed to initialize MSAL:', error);
    throw error;
  }
};

export { msalInstance, msalInitPromise };

export const getMsalInstance = () => {
  if (!msalInstance) {
    throw new Error('MSAL is not initialized. Call initializeMsal() first.');
  }
  return msalInstance;
};

export const isMsalAvailable = () => {
  return Platform.OS === 'web' && !!clientId;
};
