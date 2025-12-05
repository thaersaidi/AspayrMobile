// Web authentication using @azure/msal-browser
// This file is only imported on web platform

import { PublicClientApplication } from '@azure/msal-browser';
import { MSAL_CONFIG } from '../config/msal.config';

const clientId = MSAL_CONFIG.CLIENT_ID;
const authority = MSAL_CONFIG.AUTHORITY;
const redirectUri = MSAL_CONFIG.REDIRECT_URI_WEB;

export const msalConfig = {
  auth: {
    clientId,
    authority,
    redirectUri,
  },
  cache: {
    cacheLocation: 'localStorage' as const,
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ['User.Read', 'openid', 'profile', 'email'],
};

let msalInstance: PublicClientApplication | null = null;
let initPromise: Promise<void> | null = null;

export const initializeWebMsal = async (): Promise<PublicClientApplication> => {
  if (msalInstance) {
    return msalInstance;
  }

  try {
    msalInstance = new PublicClientApplication(msalConfig);
    initPromise = msalInstance.initialize();
    await initPromise;

    // Handle redirect response after login
    await msalInstance.handleRedirectPromise();

    console.log('[Auth] Web MSAL initialized successfully');
    return msalInstance;
  } catch (error) {
    console.error('[Auth] Failed to initialize web MSAL:', error);
    throw error;
  }
};

export const getWebMsalInstance = (): PublicClientApplication => {
  if (!msalInstance) {
    throw new Error('Web MSAL is not initialized. Call initializeWebMsal() first.');
  }
  return msalInstance;
};

export const webLogin = async (): Promise<null> => {
  if (!msalInstance) {
    await initializeWebMsal();
  }

  try {
    await msalInstance!.loginRedirect(loginRequest);
    // loginRedirect doesn't return - it redirects the page
    return null;
  } catch (error) {
    console.error('[Auth] Web MSAL login failed:', error);
    throw error;
  }
};

export const webLogout = async () => {
  if (msalInstance) {
    try {
      console.log('[Auth] Logging out from MSAL...');

      // Clear all MSAL-related items from localStorage
      if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
        const localStorage = (globalThis as any).localStorage;
        const keys = Object.keys(localStorage);
        const msalKeys = keys.filter(key =>
          key.startsWith('msal.') ||
          key.includes('login.windows.net') ||
          key.includes('login.microsoftonline.com')
        );

        msalKeys.forEach(key => {
          try {
            localStorage.removeItem(key);
            console.log('[Auth] Removed localStorage key:', key);
          } catch (e) {
            console.error('[Auth] Failed to remove key:', key, e);
          }
        });
      }

      // Clear sessionStorage as well
      if (typeof globalThis !== 'undefined' && (globalThis as any).sessionStorage) {
        try {
          (globalThis as any).sessionStorage.clear();
          console.log('[Auth] Cleared sessionStorage');
        } catch (e) {
          console.error('[Auth] Failed to clear sessionStorage:', e);
        }
      }

      // Perform MSAL logout redirect (this will also clear the cache)
      await msalInstance.logoutRedirect({
        onRedirectNavigate: () => {
          // Return false to prevent default navigation, we'll handle it ourselves
          return false;
        }
      });
    } catch (error) {
      console.error('[Auth] Web MSAL logout failed:', error);
      // Even if logout fails, try to clear storage
      if (typeof globalThis !== 'undefined') {
        try {
          (globalThis as any).localStorage?.clear();
          (globalThis as any).sessionStorage?.clear();
        } catch (e) {
          console.error('[Auth] Failed to clear storage:', e);
        }
      }
    }
  }
};

export const getWebAccount = () => {
  if (!msalInstance) {
    return null;
  }
  const accounts = msalInstance.getAllAccounts();
  return accounts.length > 0 ? accounts[0] : null;
};

export const isWebAuthAvailable = () => {
  return !!clientId;
};
