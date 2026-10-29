/**
 * VortexJudge API Client & Configuration
 * Provides dynamic baseURL resolution for production (https://vortexjudge.onrender.com)
 * and development environments, with automatic credential management and error retry.
 */

declare global {
  interface Window {
    __VORTEX_API_BASE_URL__?: string;
  }
}

export const getApiBaseUrl = (): string => {
  // 1. Explicit window override (can be injected via HTML or script tag)
  if (typeof window !== 'undefined' && window.__VORTEX_API_BASE_URL__) {
    return window.__VORTEX_API_BASE_URL__.replace(/\/+$/, '');
  }

  // 2. Vite environment variable (VITE_API_URL)
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) {
      return (import.meta as any).env.VITE_API_URL.replace(/\/+$/, '');
    }
  } catch (_) {}

  // 3. Next.js environment variable (NEXT_PUBLIC_API_URL)
  try {
    if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
    }
  } catch (_) {}

  // 4. Create React App environment variable (REACT_APP_API_URL)
  try {
    if (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL.replace(/\/+$/, '');
    }
  } catch (_) {}

  // 5. In-browser check: If hosted on same origin as backend (e.g. Render server itself)
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    if (origin.includes('vortexjudge.onrender.com')) {
      return ''; // Same-origin relative path
    }
    if (origin.includes('localhost:3000') || origin.includes('127.0.0.1:3000')) {
      return ''; // Local server relative path
    }
  }

  // 6. Default production backend on Render.com
  return 'https://vortexjudge.onrender.com';
};

export const API_BASE_URL = getApiBaseUrl();

export interface ApiFetchOptions extends RequestInit {
  retries?: number;
}

/**
 * Universal fetch wrapper for VortexJudge API
 * Automatically handles baseURL, cross-origin credentials, headers, and retry logic.
 */
export async function apiFetch<T = any>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  const { retries = 1, ...fetchOptions } = options;
  const baseUrl = getApiBaseUrl();

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = baseUrl ? `${baseUrl}${cleanEndpoint}` : cleanEndpoint;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const defaultInit: RequestInit = {
    ...fetchOptions,
    headers,
    credentials: 'include', // Essential for HTTP-only JWT cookies across origins
  };

  let lastError: any = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(fullUrl, defaultInit);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const err = new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        (err as any).status = response.status;
        (err as any).data = errorData;
        throw err;
      }
      return (await response.json()) as T;
    } catch (err: any) {
      lastError = err;
      // If client aborted or 4xx client error, do not retry
      if (err.name === 'AbortError' || (err.status && err.status >= 400 && err.status < 500)) {
        throw err;
      }
      if (attempt < retries) {
        // Wait 300ms before retry
        await new Promise((res) => setTimeout(res, 300));
      }
    }
  }

  throw lastError;
}

export default apiFetch;
