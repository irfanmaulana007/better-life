import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL as ENV_API_BASE_URL, API_LOGGING_ENABLED } from '@env';

const DEVICE_TOKEN_KEY = 'device_token';

// API Base URL - use env variable or fallback
const API_BASE_URL = ENV_API_BASE_URL || (__DEV__
  ? 'http://localhost:8080'
  : 'https://api.betterlife.app');

// API Logging Configuration from .env
// Env variables are strings, so we compare with 'true'
let apiLoggingEnabled = API_LOGGING_ENABLED === 'true';

// Runtime toggle for API logging
export function setApiLogging(enabled: boolean): void {
  apiLoggingEnabled = enabled;
  console.log(`API Logging ${enabled ? 'enabled' : 'disabled'}`);
}

export function isApiLoggingEnabled(): boolean {
  return apiLoggingEnabled;
}

// Logger utility
const apiLogger = {
  request: (config: InternalAxiosRequestConfig) => {
    if (!apiLoggingEnabled) return;

    const { method, url, params, data } = config;
    console.log('\n📤 API REQUEST');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Method: ${method?.toUpperCase()}`);
    console.log(`URL: ${config.baseURL}${url}`);
    if (params && Object.keys(params).length > 0) {
      console.log('Params:', JSON.stringify(params, null, 2));
    }
    if (data) {
      console.log('Body:', JSON.stringify(data, null, 2));
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  },

  response: (response: AxiosResponse) => {
    if (!apiLoggingEnabled) return;

    const { status, statusText, config, data } = response;
    console.log('\n📥 API RESPONSE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`URL: ${config.url}`);
    console.log(`Status: ${status} ${statusText}`);
    console.log('Data:', JSON.stringify(data, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  },

  error: (error: AxiosError) => {
    if (!apiLoggingEnabled) return;

    console.log('\n❌ API ERROR');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`URL: ${error.config?.url}`);
    console.log(`Status: ${error.response?.status || 'No response'}`);
    console.log(`Message: ${error.message}`);
    if (error.response?.data) {
      console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  },
};

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and log
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(DEVICE_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    apiLogger.request(config);
    return config;
  },
  (error) => {
    apiLogger.error(error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
api.interceptors.response.use(
  (response) => {
    apiLogger.response(response);
    return response;
  },
  async (error: AxiosError) => {
    apiLogger.error(error);
    if (error.response?.status === 401) {
      // Token invalid, clear it and re-register
      await AsyncStorage.removeItem(DEVICE_TOKEN_KEY);
    }
    return Promise.reject(error);
  }
);

// API Response types
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

interface DeviceRegistrationResponse {
  token: string;
}

// Device registration
export async function registerDevice(): Promise<string> {
  // Check if we already have a token
  const existingToken = await AsyncStorage.getItem(DEVICE_TOKEN_KEY);
  if (existingToken) {
    return existingToken;
  }

  try {
    const response = await api.post<APIResponse<DeviceRegistrationResponse>>('/api/devices');

    if (response.data.success && response.data.data?.token) {
      const token = response.data.data.token;
      await AsyncStorage.setItem(DEVICE_TOKEN_KEY, token);
      return token;
    }

    throw new Error('Failed to register device');
  } catch (error) {
    console.error('Device registration failed:', error);
    throw error;
  }
}

// Check if device is registered
export async function isDeviceRegistered(): Promise<boolean> {
  const token = await AsyncStorage.getItem(DEVICE_TOKEN_KEY);
  return !!token;
}

// Get device token
export async function getDeviceToken(): Promise<string | null> {
  return AsyncStorage.getItem(DEVICE_TOKEN_KEY);
}

// Health check
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await api.get<APIResponse<{ status: string }>>('/health');
    return response.data.success;
  } catch (error) {
    return false;
  }
}

// Sync types
export interface SyncMilestone {
  local_id: string;
  name: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SyncActivity {
  local_id: string;
  milestone_local_id: string;
  name: string;
  unit_type: string;
  unit_name: string;
  target_goal: number | null;
  schedule_days: number[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SyncSession {
  local_id: string;
  activity_local_id: string;
  date: string;
  is_completed: boolean;
  actual_result: number | null;
  target_goal: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SyncPushRequest {
  milestones?: SyncMilestone[];
  activities?: SyncActivity[];
  sessions?: SyncSession[];
}

export interface SyncResultItem {
  local_id: string;
  server_id: number;
  status: 'created' | 'updated' | 'deleted';
}

export interface SyncPushResponse {
  milestones: SyncResultItem[];
  activities: SyncResultItem[];
  sessions: SyncResultItem[];
}

export interface SyncPullResponse {
  milestones: SyncMilestone[];
  activities: SyncActivity[];
  sessions: SyncSession[];
  synced_at: string;
}

// Sync API calls
export async function pushChanges(data: SyncPushRequest): Promise<SyncPushResponse> {
  const response = await api.post<APIResponse<SyncPushResponse>>('/api/sync/push', data);

  if (response.data.success && response.data.data) {
    return response.data.data;
  }

  throw new Error(response.data.error?.message || 'Failed to push changes');
}

export async function pullChanges(since?: string): Promise<SyncPullResponse> {
  const params = since ? { since } : {};
  const response = await api.get<APIResponse<SyncPullResponse>>('/api/sync/pull', { params });

  if (response.data.success && response.data.data) {
    return response.data.data;
  }

  throw new Error(response.data.error?.message || 'Failed to pull changes');
}

export default api;
