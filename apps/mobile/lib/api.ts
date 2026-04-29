import axios from 'axios';
import * as Sentry from '@sentry/react-native';
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
  Sentry.addBreadcrumb({
    category: 'http',
    type: 'http',
    level: 'info',
    message: `${(config.method ?? 'get').toUpperCase()} ${config.url}`,
    data: { url: config.url, method: config.method, hasAuth: !!cookie },
  });
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log('[api] ←', response.status, response.config.url);
    }
    Sentry.addBreadcrumb({
      category: 'http',
      type: 'http',
      level: 'info',
      message: `${response.status} ${response.config.url}`,
      data: { url: response.config.url, status: response.status },
    });
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url;
    const message = error?.response?.data?.message ?? error?.message;
    console.warn('[api] ✗', status ?? 'network', url, '—', message);
    Sentry.addBreadcrumb({
      category: 'http',
      type: 'http',
      level: 'error',
      message: `${status ?? 'network'} ${url} — ${message}`,
      data: { url, status: status ?? 'network', message },
    });
    return Promise.reject(error);
  },
);
