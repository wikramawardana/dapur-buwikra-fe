import dns from "node:dns";
import { betterAuth } from "better-auth";
import { admin, genericOAuth } from "better-auth/plugins";
import { Pool } from "pg";

dns.setDefaultResultOrder("ipv4first");

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const authServiceUrl = process.env.AUTH_URL || "http://localhost:3001";

export const auth = betterAuth({
  baseURL: appUrl,
  basePath: "/api/auth",
  secret: process.env.BETTER_AUTH_SECRET,
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  advanced: {
    cookiePrefix: "dapur-buwikra",
  },
  account: {
    // The state cookie set at sign-in start is a cross-origin flow (3001 → 3000 → 3001).
    // The cookie is not reliably sent back on the return trip, so we skip
    // the cookie comparison and rely on the DB verification record instead.
    skipStateCookieCheck: true,
  },
  emailAndPassword: {
    enabled: false,
  },
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "auth",
          clientId: process.env.AUTH_CLIENT_ID || "dapur-buwikra",
          clientSecret: process.env.AUTH_CLIENT_SECRET!,
          discoveryUrl: `${authServiceUrl}/api/auth/.well-known/openid-configuration`,
          scopes: ["openid", "profile", "email"],
        },
      ],
    }),
    admin({
      defaultRole: "user",
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24,
    updateAge: 60 * 60,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  trustedOrigins: [
    appUrl,
    authServiceUrl,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ],
});

export type Session = typeof auth.$Infer.Session;
