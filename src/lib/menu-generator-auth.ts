import { timingSafeEqual } from "node:crypto";

type GeneratorSession = {
  user?: { role?: string | null };
  session?: { token?: string };
} | null;

/** Called before parsing or rendering, for both preview and publish requests. */
export function authorizeMenuGenerator(
  session: GeneratorSession,
  authorization: string | null,
  botToken: string | undefined,
): { authorized: boolean; token?: string } {
  if (
    (session?.user?.role === "admin" || session?.user?.role === "chef") &&
    session.session?.token
  ) {
    return { authorized: true, token: session.session.token };
  }
  if (!botToken || !authorization?.startsWith("Bearer "))
    return { authorized: false };
  const provided = Buffer.from(authorization.slice(7).trim());
  const expected = Buffer.from(botToken);
  if (
    provided.length !== expected.length ||
    !timingSafeEqual(provided, expected)
  )
    return { authorized: false };
  return { authorized: true, token: botToken };
}
