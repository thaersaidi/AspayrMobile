// Native authentication service - uses expo-auth-session
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { MSAL_CONFIG } from '../config/msal.config';

// Complete any pending auth sessions
WebBrowser.maybeCompleteAuthSession();

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

// Discovery document for Microsoft OAuth
const discovery = {
  authorizationEndpoint: `${authority}/oauth2/v2.0/authorize`,
  tokenEndpoint: `${authority}/oauth2/v2.0/token`,
  revocationEndpoint: `${authority}/oauth2/v2.0/logout`,
};

const loginRequest = {
  scopes: ['User.Read', 'openid', 'profile', 'email'],
};

// Get native redirect URI
const getNativeRedirectUri = () => {
  return AuthSession.makeRedirectUri({
    scheme: 'aspayr',
    path: 'auth',
  });
};

// Initialize authentication (no-op on native, just logs)
export const initializeMsal = async (): Promise<null> => {
  console.log('[Auth] Native authentication ready');
  console.log('[Auth] Redirect URI:', getNativeRedirectUri());
  return null;
};

// Login
export const msalLogin = async (): Promise<AuthResult | null> => {
  try {
    const redirectUri = getNativeRedirectUri();
    console.log('[Auth] Starting native auth with redirect URI:', redirectUri);

    const request = new AuthSession.AuthRequest({
      clientId,
      scopes: loginRequest.scopes,
      redirectUri,
      responseType: AuthSession.ResponseType.Token,
      usePKCE: false,
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
    console.error('[Auth] Native login failed:', error);
    throw error;
  }
};

// Logout (no persistent session on native)
export const msalLogout = async () => {
  console.log('[Auth] Native logout - session cleared');
};

// Get current account (native doesn't persist sessions)
export const getMsalAccount = async () => {
  return null;
};

// Check if auth is available
export const isMsalAvailable = () => {
  return !!clientId;
};

// Get MSAL instance (returns null on native)
export const getMsalInstance = async (): Promise<null> => {
  return null;
};

// Get redirect result (not used on native, but needed for interface compatibility)
export const getRedirectResult = (): null => {
  return null;
};

// Get newly authenticated account (not used on native)
export const getNewlyAuthenticatedAccount = (): null => {
  return null;
};
