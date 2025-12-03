import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Platform } from 'react-native';
import { API_CONFIG } from '../utils/constants';
import { API_CONFIG as BUNDLED_API_CONFIG } from '../config/msal.config';

// Helper function to get config values (react-native-config only works on native)
const getConfigValue = (key: string): string | undefined => {
  if (Platform.OS === 'web') {
    return undefined;
  }
  try {
    // Only require react-native-config on native platforms
    const Config = require('react-native-config').default;
    return Config?.[key];
  } catch {
    return undefined;
  }
};

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    // For web, use bundled config; for native, try react-native-config first
    const baseURL = Platform.OS === 'web'
      ? BUNDLED_API_CONFIG.BASE_URL
      : (getConfigValue('API_BASE_URL') || API_CONFIG.BASE_URL);

    this.instance = axios.create({
      baseURL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        // Add auth token if available
        // const token = await getAuthToken();
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Handle token refresh, retry logic, etc.
        if (error.response?.status === 401) {
          // Token expired, refresh or logout
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.put(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.delete(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
