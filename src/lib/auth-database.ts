const CENTRAL_AUTH_DATABASES = new Set(["auth", "auth-dev"]);

export function requireIsolatedAuthDatabase(
  connectionString: string | undefined,
): string {
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  let databaseName: string;
  try {
    databaseName = new URL(connectionString).pathname.replace(/^\//, "");
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL URL");
  }

  if (!databaseName || CENTRAL_AUTH_DATABASES.has(databaseName)) {
    throw new Error(
      "Dapur Bu Wikra must use its own Better Auth database; the central Auth database is not allowed",
    );
  }

  return connectionString;
}
