"use client";

import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Use dynamic origin to ensure session works correctly across environments
// NEXT_PUBLIC_* vars are baked at build time, so we use window.location.origin for client-side
const getBaseURL = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [adminClient()],
});

export const { signIn, signOut, useSession, getSession } = authClient;
