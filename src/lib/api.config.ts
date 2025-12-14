"use client";

import { getSession } from "@/lib/auth-client";

/**
 * API Configuration
 * Configure the base URL for the backend API
 */

// Use environment variable or fallback to localhost
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

// Backend base URL (without /api/v1) for static files like images
export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

/**
 * Get full URL for uploaded files (images, etc.)
 */
export function getUploadUrl(path: string): string {
  if (!path) return "";
  // If already a full URL, return as is
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  // Prepend backend URL
  return `${BACKEND_URL}${path}`;
}

// Cache for the session token promise to avoid multiple get-session calls
let tokenPromise: Promise<string | null> | null = null;
let tokenExpiry = 0;
const TOKEN_CACHE_DURATION = 5000; // Cache token for 5 seconds

/**
 * Clear the token cache (call this on logout or auth errors)
 */
export function clearAuthTokenCache(): void {
  tokenPromise = null;
  tokenExpiry = 0;
}

/**
 * Get the session token for API authorization (with caching)
 */
export async function getAuthToken(): Promise<string | null> {
  const now = Date.now();

  // Return cached promise if still valid
  if (tokenPromise && now < tokenExpiry) {
    return tokenPromise;
  }

  // Create new token promise
  tokenPromise = (async () => {
    try {
      const session = await getSession();
      return session?.data?.session?.token ?? null;
    } catch {
      return null;
    }
  })();

  tokenExpiry = now + TOKEN_CACHE_DURATION;
  return tokenPromise;
}

/**
 * Build query string from object
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * Handle API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Generic fetch wrapper with error handling and authorization
 */
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit & { skipContentType?: boolean },
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Get the auth token
  const token = await getAuthToken();

  // If no token available, redirect to login
  if (!token) {
    clearAuthTokenCache();
    if (typeof window !== "undefined") {
      window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
    }
    throw new ApiError("No authentication token available", 401);
  }

  // Build headers - skip Content-Type for FormData uploads
  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    ...options?.headers,
  };

  if (!options?.skipContentType) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle authentication errors - redirect to login
      if (response.status === 401 || response.status === 403) {
        clearAuthTokenCache();
        if (typeof window !== "undefined") {
          window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
        }
      }

      throw new ApiError(
        errorData.message || `HTTP error! status: ${response.status}`,
        response.status,
        errorData,
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : "An unknown error occurred",
    );
  }
}
