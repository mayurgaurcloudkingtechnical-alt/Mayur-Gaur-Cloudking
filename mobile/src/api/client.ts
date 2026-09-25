import { APP_CONFIG } from "../constants/config";
import { TokenStorage } from "../storage/secureStore";
import { AuthSessionResponse, ApiErrorResponse } from "../types";

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Single-flight refresh token lock
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
let onAuthFailureCallback: (() => void) | null = null;
let customFetchFn: typeof fetch | null = null;

export function registerAuthFailureHandler(callback: () => void) {
  onAuthFailureCallback = callback;
}

export function setCustomFetch(fn: typeof fetch | null) {
  customFetchFn = fn;
}

/**
 * Executes a single-flight token refresh to prevent concurrent 401 retry storms.
 */
async function performTokenRefresh(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  const fetchFn = customFetchFn || fetch;
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const currentRefreshToken = await TokenStorage.getRefreshToken();
      if (!currentRefreshToken) {
        throw new Error("No refresh token available");
      }

      const res = await fetchFn(`${APP_CONFIG.API_BASE_URL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
      });

      if (!res.ok) {
        throw new Error(`Refresh failed with status ${res.status}`);
      }

      const data: AuthSessionResponse = await res.json();
      await TokenStorage.saveTokens(data.accessToken, data.refreshToken);
      await TokenStorage.saveUser(data.user);
      return data.accessToken;
    } catch {
      await TokenStorage.clearSession();
      if (onAuthFailureCallback) {
        onAuthFailureCallback();
      }
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  retryOn401?: boolean;
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth = false, retryOn401 = true, ...fetchOptions } = options;

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${APP_CONFIG.API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const headers = new Headers(fetchOptions.headers || {});
  if (!headers.has("Content-Type") && !(fetchOptions.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // 1. Attach Bearer Access Token if not skipped
  if (!skipAuth) {
    const accessToken = await TokenStorage.getAccessToken();
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
  }

  // 2. Perform HTTP Request
  const fetchFn = customFetchFn || fetch;
  let response = await fetchFn(url, {
    ...fetchOptions,
    headers,
  });

  // 3. Handle 401 Unauthorized with Token Refresh
  if (response.status === 401 && !skipAuth && retryOn401) {
    const newAccessToken = await performTokenRefresh();
    if (newAccessToken) {
      // Retry original request with newly issued access token
      const retryHeaders = new Headers(fetchOptions.headers || {});
      if (!retryHeaders.has("Content-Type") && !(fetchOptions.body instanceof FormData)) {
        retryHeaders.set("Content-Type", "application/json");
      }
      retryHeaders.set("Authorization", `Bearer ${newAccessToken}`);

      response = await fetchFn(url, {
        ...fetchOptions,
        headers: retryHeaders,
      });
    }
  }

  // 4. Parse response
  if (!response.ok) {
    let errBody: ApiErrorResponse | null = null;
    try {
      errBody = await response.json();
    } catch {
      // Body not JSON
    }

    const message = errBody?.error || `HTTP error ${response.status}: ${response.statusText}`;
    throw new ApiError(message, response.status, errBody?.code, errBody?.details);
  }

  // Parse JSON if response has content
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
}

apiClient.get = function <T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  return apiClient<T>(endpoint, { ...options, method: "GET" });
};

apiClient.post = function <T = any>(
  endpoint: string,
  body?: any,
  options: RequestOptions = {}
): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: "POST",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
};
