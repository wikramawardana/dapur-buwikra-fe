"use client";

import { getSession, signOut } from "@/lib/auth-client";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export function getUploadUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${BACKEND_URL}${path}`;
}

let tokenPromise: Promise<string | null> | null = null;
let tokenExpiry = 0;
const TOKEN_CACHE_DURATION = 5000;

export function clearAuthTokenCache(): void {
  tokenPromise = null;
  tokenExpiry = 0;
}

export async function getAuthToken(): Promise<string | null> {
  const now = Date.now();

  if (tokenPromise && now < tokenExpiry) {
    return tokenPromise;
  }

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

let isSigningOut = false;

async function forceSignOutAndRedirect() {
  if (isSigningOut || typeof window === "undefined") return;
  isSigningOut = true;

  clearAuthTokenCache();

  const callbackUrl = encodeURIComponent(window.location.pathname);

  try {
    await signOut();
  } catch {
    // Best-effort: clear cookies manually if signOut API fails
    document.cookie = "dapur-buwikra.session_token=; Max-Age=0; path=/";
    document.cookie = "dapur-buwikra.session_data=; Max-Age=0; path=/";
  }

  window.location.href = `/login?callbackUrl=${callbackUrl}`;
}

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit & { skipContentType?: boolean },
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  let token = await getAuthToken();

  if (!token) {
    forceSignOutAndRedirect();
    throw new ApiError("No authentication token available", 401);
  }

  const request = (authToken: string) => {
    const headers = new Headers(options?.headers);
    headers.set("Authorization", `Bearer ${authToken}`);

    if (!options?.skipContentType && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    return fetch(url, { ...options, headers });
  };

  try {
    let response = await request(token);

    // A just-rotated session can leave the five-second client token cache
    // stale. Refresh once before treating the user as signed out.
    if (response.status === 401) {
      clearAuthTokenCache();
      token = await getAuthToken();
      if (token) {
        response = await request(token);
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // 401 means the session token is missing or invalid. A 403 means the
      // user is authenticated but lacks permission, so keep their session.
      if (response.status === 401) {
        await forceSignOutAndRedirect();
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
