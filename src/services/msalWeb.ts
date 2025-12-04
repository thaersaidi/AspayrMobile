// Web-only MSAL implementation
// This file is only imported on web platform
import { PublicClientApplication } from '@azure/msal-browser';

export { PublicClientApplication };

export const createMsalInstance = (config: any) => {
  return new PublicClientApplication(config);
};
