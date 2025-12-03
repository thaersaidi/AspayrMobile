// MSAL Configuration
// For web platform, these values are bundled directly into the app
// For native platforms, use react-native-config with .env file

export const MSAL_CONFIG = {
  CLIENT_ID: '1b169be3-8672-4bdc-933f-fc4c3231e361',
  TENANT_ID: '54f25355-87cb-43b2-8483-6d1700834927',
  AUTHORITY: 'https://login.microsoftonline.com/54f25355-87cb-43b2-8483-6d1700834927/B2X_1_Aspayr',
  REDIRECT_URI_WEB: 'http://localhost:8081/auth/callback',
  REDIRECT_URI_NATIVE: '', // Add native redirect URI when needed
};

export const API_CONFIG = {
  BASE_URL: 'http://localhost:4000',
};
