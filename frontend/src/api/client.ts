import axios from 'axios';
import { clearAuthSession, getAuthToken } from '../utils/authStorage';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const pendingGetRequests = new Map<string, Promise<unknown>>();

const client = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  withCredentials: true,
});

const buildRequestKey = (config: any) => {
  const method = String(config.method || 'get').toLowerCase();
  if (method !== 'get') {
    return null;
  }

  const params = config.params ? JSON.stringify(config.params) : '';
  return `${method}:${config.baseURL || ''}:${config.url || ''}:${params}`;
};

// Add auth token automatically
client.interceptors.request.use(
  (config) => {
    const token = getAuthToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const requestKey = buildRequestKey(config);
    if (requestKey) {
      const pending = pendingGetRequests.get(requestKey);
      if (pending) {
        (config as any).adapter = () => pending as any;
      } else {
        const adapter = axios.getAdapter(config.adapter || client.defaults.adapter);
        const pendingRequest = adapter(config).finally(() => {
          pendingGetRequests.delete(requestKey);
        });
        pendingGetRequests.set(requestKey, pendingRequest);
        (config as any).adapter = () => pendingRequest as any;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle unauthorized responses
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      clearAuthSession();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default client;
