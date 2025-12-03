import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { STORAGE_KEYS, KEYCHAIN_KEYS } from './constants';

/**
 * AsyncStorage utilities (non-sensitive data)
 */
export const storage = {
  // Get item
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error getting ${key} from storage:`, error);
      return null;
    }
  },

  // Set item
  async set(key: string, value: any): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting ${key} in storage:`, error);
      return false;
    }
  },

  // Remove item
  async remove(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error);
      return false;
    }
  },

  // Clear all
  async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  },
};

/**
 * Keychain utilities (sensitive data like PIN, tokens)
 */
export const secureStorage = {
  // Save credentials
  async setCredentials(
    username: string,
    password: string,
    service?: string
  ): Promise<boolean> {
    try {
      await Keychain.setGenericPassword(username, password, {
        service: service || 'aspayr',
      });
      return true;
    } catch (error) {
      console.error('Error saving credentials:', error);
      return false;
    }
  },

  // Get credentials
  async getCredentials(
    service?: string
  ): Promise<{ username: string; password: string } | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: service || 'aspayr',
      });
      if (credentials) {
        return {
          username: credentials.username,
          password: credentials.password,
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting credentials:', error);
      return null;
    }
  },

  // Remove credentials
  async removeCredentials(service?: string): Promise<boolean> {
    try {
      // Check if Keychain is available (not available on web)
      if (Keychain && Keychain.resetGenericPassword) {
        await Keychain.resetGenericPassword({
          service: service || 'aspayr',
        });
      }
      return true;
    } catch {
      // Silently ignore errors on web where Keychain is not supported
      return true;
    }
  },

  // Save PIN
  async setPIN(userUuid: string, pin: string): Promise<boolean> {
    return this.setCredentials(userUuid, pin, KEYCHAIN_KEYS.PIN);
  },

  // Get PIN
  async getPIN(userUuid: string): Promise<string | null> {
    const credentials = await this.getCredentials(KEYCHAIN_KEYS.PIN);
    if (credentials && credentials.username === userUuid) {
      return credentials.password;
    }
    return null;
  },

  // Verify PIN
  async verifyPIN(userUuid: string, pin: string): Promise<boolean> {
    const storedPIN = await this.getPIN(userUuid);
    return storedPIN === pin;
  },

  // Save access token
  async setAccessToken(token: string): Promise<boolean> {
    return this.setCredentials('token', token, KEYCHAIN_KEYS.ACCESS_TOKEN);
  },

  // Get access token
  async getAccessToken(): Promise<string | null> {
    const credentials = await this.getCredentials(
      KEYCHAIN_KEYS.ACCESS_TOKEN
    );
    return credentials?.password || null;
  },

  // Remove access token
  async removeAccessToken(): Promise<boolean> {
    return this.removeCredentials(KEYCHAIN_KEYS.ACCESS_TOKEN);
  },
};

/**
 * User-specific storage helpers
 */
export const userStorage = {
  // Generic get/set (pass-through to storage)
  async get(key: string) {
    return storage.get(key);
  },

  async set(key: string, value: any) {
    return storage.set(key, value);
  },

  // Get user data
  async getUser() {
    return storage.get(STORAGE_KEYS.USER);
  },

  // Set user data
  async setUser(user: any) {
    return storage.set(STORAGE_KEYS.USER, user);
  },

  // Remove user data
  async removeUser() {
    return storage.remove(STORAGE_KEYS.USER);
  },

  // Get theme preference
  async getTheme(): Promise<'light' | 'dark' | null> {
    return storage.get(STORAGE_KEYS.THEME);
  },

  // Set theme preference
  async setTheme(theme: 'light' | 'dark') {
    return storage.set(STORAGE_KEYS.THEME, theme);
  },

  // Get chat messages
  async getChatMessages() {
    return storage.get(STORAGE_KEYS.CHAT_MESSAGES) || [];
  },

  // Set chat messages
  async setChatMessages(messages: any[]) {
    return storage.set(STORAGE_KEYS.CHAT_MESSAGES, messages);
  },

  // Get consent tokens for user
  async getConsentTokens(userKey: string) {
    const store = await storage.get<Record<string, any[]>>(
      STORAGE_KEYS.CONSENT_TOKENS
    );
    return store?.[userKey] || [];
  },

  // Set consent tokens for user
  async setConsentTokens(userKey: string, tokens: any[]) {
    const store = await storage.get<Record<string, any[]>>(
      STORAGE_KEYS.CONSENT_TOKENS
    ) || {};
    store[userKey] = tokens;
    return storage.set(STORAGE_KEYS.CONSENT_TOKENS, store);
  },

  // Check if onboarding is completed
  async isOnboardingCompleted(): Promise<boolean> {
    const value = await storage.get<boolean>(
      STORAGE_KEYS.ONBOARDING_COMPLETED
    );
    return value === true;
  },

  // Set onboarding completed
  async setOnboardingCompleted(completed: boolean) {
    return storage.set(STORAGE_KEYS.ONBOARDING_COMPLETED, completed);
  },

  // Check if biometric is enabled
  async isBiometricEnabled(): Promise<boolean> {
    const value = await storage.get<boolean>(
      STORAGE_KEYS.BIOMETRIC_ENABLED
    );
    return value === true;
  },

  // Set biometric enabled
  async setBiometricEnabled(enabled: boolean) {
    return storage.set(STORAGE_KEYS.BIOMETRIC_ENABLED, enabled);
  },

  // Check if session is verified (PIN entered)
  async isSessionVerified(): Promise<boolean> {
    const value: any = await storage.get('aspayr_session_verified');
    return value === true || value === 'true';
  },

  // Set session verified (after PIN entry)
  async setSessionVerified(verified: boolean) {
    return storage.set('aspayr_session_verified', verified);
  },
};
