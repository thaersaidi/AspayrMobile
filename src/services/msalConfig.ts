import { Platform } from 'react-native';
import { MSAL_CONFIG } from '../config/msal.config';
import { createMsalInstance, isMsalSupported } from './msalWeb';

// Lazy load expo modules only when needed on native
let AuthSession: any = null;
let WebBrowser: any = null;

// MSAL instance for web
let webMsalInstance: any = null;

// Cached native redirect URI
let _nativeRedirectUri: string | null = null;

// Helper to get native redirect URI lazily
const getNativeRedirectUri = () => {
  if (_nativeRedirectUri) return _nativeRedirectUri;
  
  if (Platform.OS === 'web') {
    return '';
  }
  
  try {
    if (!AuthSession) {
      AuthSession = require('expo-auth-session');
    }
    _nativeRedirectUri = AuthSession.makeRedirectUri({
      scheme: 'aspayr',
      path: 'auth',
    });
    return _nativeRedirectUri;
  } catch (e) {
    console.warn('[Auth] Failed to create native redirect URI:', e);
    return '';
  }
};

// Complete auth session for native platforms (called lazily)
const completeAuthSession = () => {
  if (Platform.OS !== 'web') {
    try {
      if (!WebBrowser) {
        WebBrowser = require('expo-web-browser');
      }
      WebBrowser.maybeCompleteAuthSession();
    } catch (e) {
      console.warn('[Auth] Failed to complete auth session:', e);
    }
  }
};

// Helper function to safely get config from Expo environment variables
const getNativeConfig = () => {
  if (Platform.OS === 'web') {
    return null;
  }
  return {
    MSAL_CLIENT_ID: process.env.EXPO_PUBLIC_MSAL_CLIENT_ID,
    MSAL_TENANT_ID: process.env.EXPO_PUBLIC_MSAL_TENANT_ID,
    MSAL_AUTHORITY: process.env.EXPO_PUBLIC_MSAL_AUTHORITY,
    MSAL_REDIRECT_URI: process.env.EXPO_PUBLIC_MSAL_REDIRECT_URI,
  };
};

// Platform-specific config loading
let Config: any = {};
if (Platform.OS === 'web') {
  Config = {
    MSAL_CLIENT_ID: MSAL_CONFIG.CLIENT_ID,
    MSAL_TENANT_ID: MSAL_CONFIG.TENANT_ID,
    MSAL_AUTHORITY: MSAL_CONFIG.AUTHORITY,
    MSAL_REDIRECT_URI: MSAL_CONFIG.REDIRECT_URI_WEB,
  };
} else {
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

const resolvedAuthority =
  authorityEnv ||
  (tenantId
    ? `https://login.microsoftonline.com/${tenantId}`
    : 'https://login.microsoftonline.com/consumers');

const webRedirectUri = Config.MSAL_REDIRECT_URI || (typeof window !== 'undefined' ? window.location.origin : '');

// Debug logging (defer native redirect URI logging)
console.log('[MSAL Config] Loaded configuration:', {
  platform: Platform.OS,
  clientId: clientId ? `${clientId.substring(0, 8)}...` : 'MISSING',
  authority: resolvedAuthority,
  redirectUri: Platform.OS === 'web' ? webRedirectUri : '(native - lazy loaded)',
});

if (!clientId) {
  console.warn('[Auth] MSAL_CLIENT_ID is not set. Microsoft sign-in will be disabled.');
}

// Microsoft OAuth discovery document
const discovery = {
  authorizationEndpoint: `${resolvedAuthority}/oauth2/v2.0/authorize`,
  tokenEndpoint: `${resolvedAuthority}/oauth2/v2.0/token`,
  revocationEndpoint: `${resolvedAuthority}/oauth2/v2.0/logout`,
};

// Get the redirect URI based on platform
const getRedirectUri = () => {
  if (Platform.OS === 'web') {
    return webRedirectUri;
  }
  return getNativeRedirectUri();
};

export const msalConfig = {
  auth: {
    clientId: clientId || '',
    authority: resolvedAuthority,
    redirectUri: webRedirectUri, // Web only uses this config
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ['User.Read', 'openid', 'profile', 'email'],
};

let msalInitPromise: Promise<void> | null = null;

export const initializeMsal = async () => {
  // For native platforms, complete any pending auth session and prepare
  if (Platform.OS !== 'web') {
    completeAuthSession();
    console.log('[Auth] Native MSAL (expo-auth-session) ready');
    console.log('[Auth] Native redirect URI:', getNativeRedirectUri());
    return null;
  }

  // Initialize for web platform
  if (webMsalInstance) {
    return webMsalInstance;
  }

  try {
    if (!isMsalSupported) {
      throw new Error('MSAL is not available on this platform');
    }

    webMsalInstance = createMsalInstance(msalConfig);
    msalInitPromise = webMsalInstance.initialize();
    await msalInitPromise;
    
    // Handle redirect response after login
    await webMsalInstance.handleRedirectPromise();
    
    console.log('[Auth] Web MSAL initialized successfully');
    return webMsalInstance;
  } catch (error) {
    console.error('[Auth] Failed to initialize web MSAL:', error);
    throw error;
  }
};

export const getMsalInstance = () => {
  if (Platform.OS !== 'web') {
    throw new Error('Use msalLogin() for native platforms instead of getMsalInstance()');
  }
  
  if (!webMsalInstance) {
    throw new Error('Web MSAL is not initialized. Call initializeMsal() first.');
  }
  return webMsalInstance;
};

export const isMsalAvailable = () => {
  return !!clientId;
};

// Platform-specific login function
export const msalLogin = async (): Promise<{
  accessToken: string;
  account: {
    username?: string;
    name?: string;
    localAccountId?: string;
  };
} | null> => {
  if (Platform.OS !== 'web') {
    // Native login using expo-auth-session
    try {
      // Lazy load AuthSession
      if (!AuthSession) {
        AuthSession = require('expo-auth-session');
      }
      
      const redirectUri = getNativeRedirectUri();
      console.log('[Auth] Starting native auth with redirect URI:', redirectUri);
      
      const request = new AuthSession.AuthRequest({
        clientId,
        scopes: loginRequest.scopes,
        redirectUri,
        responseType: AuthSession.ResponseType.Token,
        usePKCE: false, // Microsoft doesn't require PKCE for implicit flow
      });

      const result = await request.promptAsync(discovery);
      
      if (result.type === 'success' && result.authentication) {
        const accessToken = result.authentication.accessToken;
        
        // Fetch user info from Microsoft Graph
        const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        
        if (!userInfoResponse.ok) {
          throw new Error('Failed to fetch user info');
        }
        
        const userInfo = await userInfoResponse.json();
        
        return {
          accessToken,
          account: {
            username: userInfo.mail || userInfo.userPrincipalName,
            name: userInfo.displayName,
            localAccountId: userInfo.id,
          },
        };
      } else if (result.type === 'cancel') {
        console.log('[Auth] User cancelled login');
        return null;
      } else if (result.type === 'error') {
        throw new Error(result.error?.message || 'Authentication failed');
      }
      
      return null;
    } catch (error) {
      console.error('[Auth] Native MSAL login failed:', error);
      throw error;
    }
  }
  
  // Web login using @azure/msal-browser
  if (!webMsalInstance) {
    await initializeMsal();
  }
  
  try {
    await webMsalInstance.loginRedirect(loginRequest);
    // Note: loginRedirect doesn't return a result - it redirects the page
    return null;
  } catch (error) {
    console.error('[Auth] Web MSAL login failed:', error);
    throw error;
  }
};

// Platform-specific logout function
export const msalLogout = async () => {
  if (Platform.OS !== 'web') {
    // For native, we just clear any cached tokens
    // expo-auth-session doesn't maintain persistent sessions
    console.log('[Auth] Native logout - session cleared');
    return;
  }
  
  if (webMsalInstance) {
    try {
      await webMsalInstance.logoutRedirect();
    } catch (error) {
      console.error('[Auth] Web MSAL logout failed:', error);
    }
  }
};

// Get current account (web only - native doesn't persist sessions)
export const getMsalAccount = async () => {
  if (Platform.OS !== 'web') {
    // Native doesn't persist sessions with expo-auth-session
    return null;
  }
  
  if (!webMsalInstance) {
    return null;
  }
  
  const accounts = webMsalInstance.getAllAccounts();
  return accounts.length > 0 ? accounts[0] : null;
};

// Export for backwards compatibility
export const msalInstance = null;
export { msalInitPromise };
export { discovery };
export { getRedirectUri, getNativeRedirectUri };
