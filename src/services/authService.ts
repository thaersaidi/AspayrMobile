// Unified authentication service
// Uses platform-specific implementations under the hood

import { Platform } from 'react-native';

// Type definitions
export interface AuthResult {
  accessToken: string;
  account: {
    username?: string;
    name?: string;
    localAccountId?: string;
  };
}

// Lazy imports to avoid loading wrong platform code
let webAuth: typeof import('./webAuth') | null = null;
let nativeAuth: typeof import('./nativeAuth') | null = null;

const getWebAuth = async () => {
  if (!webAuth) {
    webAuth = await import('./webAuth');
  }
  return webAuth;
};

const getNativeAuth = async () => {
  if (!nativeAuth) {
    nativeAuth = await import('./nativeAuth');
  }
  return nativeAuth;
};

// Initialize authentication
export const initializeMsal = async () => {
  console.log('[Auth] Initializing for platform:', Platform.OS);
  
  if (Platform.OS === 'web') {
    const auth = await getWebAuth();
    return auth.initializeWebMsal();
  } else {
    // Native auth is ready to use immediately
    console.log('[Auth] Native authentication ready');
    return null;
  }
};

// Login
export const msalLogin = async (): Promise<AuthResult | null> => {
  if (Platform.OS === 'web') {
    const auth = await getWebAuth();
    return auth.webLogin();
  } else {
    const auth = await getNativeAuth();
    return auth.nativeLogin();
  }
};

// Logout
export const msalLogout = async () => {
  if (Platform.OS === 'web') {
    const auth = await getWebAuth();
    return auth.webLogout();
  } else {
    const auth = await getNativeAuth();
    return auth.nativeLogout();
  }
};

// Get current account (web only)
export const getMsalAccount = async () => {
  if (Platform.OS === 'web') {
    const auth = await getWebAuth();
    return auth.getWebAccount();
  }
  return null;
};

// Check if auth is available
export const isMsalAvailable = () => {
  // Check synchronously using config
  try {
    const { MSAL_CONFIG } = require('../config/msal.config');
    return !!MSAL_CONFIG.CLIENT_ID;
  } catch {
    return false;
  }
};

// Get MSAL instance (web only, for redirect handling)
export const getMsalInstance = async () => {
  if (Platform.OS !== 'web') {
    return null;
  }
  const auth = await getWebAuth();
  return auth.getWebMsalInstance();
};
