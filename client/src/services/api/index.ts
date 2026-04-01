import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_TOKEN_KEY = 'device_token';
const API_BASE_URL = __DEV__
  ? 'http://localhost:8080'
  : 'https://api.betterlife.app'; // Update with production URL

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(DEVICE_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
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
