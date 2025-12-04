// Web-only MSAL implementation
import { PublicClientApplication } from '@azure/msal-browser';

export { PublicClientApplication };

export const createMsalInstance = (config: any) => {
  return new PublicClientApplication(config);
};

export const isMsalSupported = true;
