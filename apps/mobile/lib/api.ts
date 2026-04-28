import axios from 'axios';
import { authClient } from '@enxoval/auth-client';
import { clientEnv } from '@enxoval/env/client';

const API_URL = clientEnv.EXPO_PUBLIC_API_URL;

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const cookie = authClient.getCookie();
  if (cookie) config.headers['Cookie'] = cookie;
  if (__DEV__) {
    console.log('[api] →', (config.method ?? 'get').toUpperCase(), config.url, cookie ? '(auth)' : '(no-auth)');
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log('[api] ←', response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url;
    const message = error?.response?.data?.message ?? error?.message;
    console.warn('[api] ✗', status ?? 'network', url, '—', message);
    return Promise.reject(error);
  },
);
