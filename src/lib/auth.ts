import dns from "node:dns";
import { betterAuth } from "better-auth";
import { admin, genericOAuth } from "better-auth/plugins";
import { Pool } from "pg";
import { requireIsolatedAuthDatabase } from "./auth-database";

dns.setDefaultResultOrder("ipv4first");

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const authServiceUrl = process.env.AUTH_URL || "http://localhost:3001";
const authInternalUrl = process.env.AUTH_INTERNAL_URL || authServiceUrl;
const databaseUrl = requireIsolatedAuthDatabase(process.env.DATABASE_URL);

export const auth = betterAuth({
  baseURL: appUrl,
  basePath: "/api/auth",
  secret: process.env.BETTER_AUTH_SECRET,
  database: new Pool({
    connectionString: databaseUrl,
  }),
  advanced: {
    cookiePrefix: "dapur-buwikra",
  },
  account: {
    skipStateCookieCheck: false,
    storeStateStrategy: "database",
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
          issuer: authServiceUrl,
          authorizationUrl: `${authServiceUrl}/api/auth/oauth2/authorize`,
          tokenUrl: `${authInternalUrl}/api/auth/oauth2/token`,
          userInfoUrl: `${authInternalUrl}/api/auth/oauth2/userinfo`,
          scopes: ["openid", "profile", "email"],
          overrideUserInfo: true,
          mapProfileToUser: (profile: Record<string, unknown>) => {
            const appRole =
              typeof profile.app_role === "string" ? profile.app_role : "user";
            const email =
              typeof profile.email === "string"
                ? profile.email.toLowerCase()
                : undefined;

            // Safe because this app owns its auth DB (never shared): stamp the
            // central IdP's `app_role` claim into user.role at every login.
            return { email, role: appRole };
          },
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
      enabled: false,
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
