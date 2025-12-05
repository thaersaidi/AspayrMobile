// Web authentication service - uses @azure/msal-browser
import { PublicClientApplication, AuthenticationResult, AccountInfo } from '@azure/msal-browser';
import { MSAL_CONFIG } from '../config/msal.config';

// Type definitions
export interface AuthResult {
  accessToken: string;
  account: {
    username?: string;
    name?: string;
    localAccountId?: string;
  };
}

const clientId = MSAL_CONFIG.CLIENT_ID;
const authority = MSAL_CONFIG.AUTHORITY;
const redirectUri = MSAL_CONFIG.REDIRECT_URI_WEB;

// Session storage key for pending auth
const PENDING_AUTH_KEY = 'aspayr_pending_auth';

const msalConfig = {
  auth: {
    clientId,
    authority,
    redirectUri,
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: 'localStorage' as const,
    storeAuthStateInCookie: true, // Enable cookies for better redirect handling
  },
};

const loginRequest = {
  scopes: ['User.Read', 'openid', 'profile', 'email'],
};

let msalInstance: PublicClientApplication | null = null;
let initPromise: Promise<PublicClientApplication | null> | null = null;

// Check if we're on the auth callback URL
const isAuthCallback = () => {
  if (typeof window === 'undefined') return false;
  const url = window.location.href;
  return url.includes('/auth/callback') || url.includes('code=') || url.includes('id_token=') || url.includes('#state=');
};

// Store auth account in session storage
const storePendingAuth = (account: AccountInfo) => {
  try {
    sessionStorage.setItem(PENDING_AUTH_KEY, JSON.stringify({
      username: account.username,
      name: account.name,
      localAccountId: account.localAccountId,
      timestamp: Date.now(),
    }));
    console.log('[Auth] Stored pending auth in sessionStorage');
  } catch (e) {
    console.error('[Auth] Failed to store pending auth:', e);
  }
};

// Get and clear pending auth from session storage
const getPendingAuth = (): AccountInfo | null => {
  try {
    const data = sessionStorage.getItem(PENDING_AUTH_KEY);
    if (data) {
      sessionStorage.removeItem(PENDING_AUTH_KEY);
      const parsed = JSON.parse(data);
      // Only use if less than 5 minutes old
      if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
        console.log('[Auth] Retrieved pending auth from sessionStorage:', parsed.username);
        return parsed as AccountInfo;
      }
    }
  } catch (e) {
    console.error('[Auth] Failed to get pending auth:', e);
  }
  return null;
};

// Initialize authentication
export const initializeMsal = async (): Promise<PublicClientApplication | null> => {
  if (initPromise) {
    return initPromise;
  }
  
  if (msalInstance) {
    return msalInstance;
  }

  initPromise = (async () => {
    console.log('[Auth] Initializing web MSAL');
    console.log('[Auth] Current URL:', window.location.href);
    console.log('[Auth] Is auth callback:', isAuthCallback());
    
    try {
      msalInstance = new PublicClientApplication(msalConfig);
      await msalInstance.initialize();

      console.log('[Auth] Calling handleRedirectPromise...');
      const response = await msalInstance.handleRedirectPromise();
      console.log('[Auth] handleRedirectPromise result:', response ? 'Got response' : 'No response');
      
      if (response && response.account) {
        console.log('[Auth] Redirect response received:', response.account.username);
        // Store in sessionStorage for reliable retrieval
        storePendingAuth(response.account);
      } else if (isAuthCallback()) {
        // We're on the callback URL but didn't get a response - check accounts
        const accounts = msalInstance.getAllAccounts();
        console.log('[Auth] On callback URL, accounts:', accounts.length);
        
        if (accounts.length > 0) {
          console.log('[Auth] Found account:', accounts[0].username);
          storePendingAuth(accounts[0]);
        }
      }
      
      // Clean up the URL if we're on the callback
      if (isAuthCallback() && typeof window !== 'undefined') {
        console.log('[Auth] Cleaning up URL, redirecting to /');
        window.history.replaceState({}, document.title, '/');
      }

      console.log('[Auth] Web MSAL initialized successfully');
      return msalInstance;
    } catch (error) {
      console.error('[Auth] Failed to initialize web MSAL:', error);
      initPromise = null;
      throw error;
    }
  })();
  
  return initPromise;
};

// Get the redirect result - checks sessionStorage
export const getRedirectResult = (): { account: AccountInfo } | null => {
  const account = getPendingAuth();
  if (account) {
    return { account };
  }
  return null;
};

// Get newly authenticated account
export const getNewlyAuthenticatedAccount = (): AccountInfo | null => {
  return getPendingAuth();
};

// Login
export const msalLogin = async (): Promise<AuthResult | null> => {
  if (!msalInstance) {
    await initializeMsal();
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

// Logout
export const msalLogout = async () => {
  if (msalInstance) {
    try {
      await msalInstance.logoutRedirect();
    } catch (error) {
      console.error('[Auth] Web MSAL logout failed:', error);
    }
  }
};

// Get current account
export const getMsalAccount = async () => {
  if (!msalInstance) {
    return null;
  }
  const accounts = msalInstance.getAllAccounts();
  return accounts.length > 0 ? accounts[0] : null;
};

// Check if auth is available
export const isMsalAvailable = () => {
  return !!clientId;
};

// Get MSAL instance (for redirect handling)
export const getMsalInstance = async (): Promise<PublicClientApplication | null> => {
  if (!msalInstance) {
    await initializeMsal();
  }
  return msalInstance;
};
