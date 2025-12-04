// Native stub - MSAL browser is not used on native platforms
// Native platforms use expo-auth-session instead

export const PublicClientApplication = null;

export const createMsalInstance = (_config: any) => {
  throw new Error('MSAL browser is not supported on native platforms. Use expo-auth-session instead.');
};

export const isMsalSupported = false;
