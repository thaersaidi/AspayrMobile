// Native authentication using expo-auth-session
// This file is only imported on native platforms

import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { MSAL_CONFIG } from '../config/msal.config';

// Complete any pending auth sessions
if (Platform.OS !== 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

const clientId = MSAL_CONFIG.CLIENT_ID;
const authority = MSAL_CONFIG.AUTHORITY;

// Discovery document for Microsoft OAuth
export const discovery = {
  authorizationEndpoint: `${authority}/oauth2/v2.0/authorize`,
  tokenEndpoint: `${authority}/oauth2/v2.0/token`,
  revocationEndpoint: `${authority}/oauth2/v2.0/logout`,
};

// Get native redirect URI
export const getNativeRedirectUri = () => {
  return AuthSession.makeRedirectUri({
    scheme: 'aspayr',
    path: 'auth',
  });
};

export const loginRequest = {
  scopes: ['User.Read', 'openid', 'profile', 'email'],
};

// Native login function
export const nativeLogin = async (): Promise<{
  accessToken: string;
  account: {
    username?: string;
    name?: string;
    localAccountId?: string;
  };
} | null> => {
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

export const nativeLogout = async () => {
  // expo-auth-session doesn't maintain persistent sessions
  console.log('[Auth] Native logout - session cleared');
};

export const isNativeAuthAvailable = () => {
  return !!clientId;
};
