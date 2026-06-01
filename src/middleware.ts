import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

const publicPrefixes = ["/login", "/api/auth"];
const routeRoles: Array<{ prefix: string; roles: string[] }> = [
  { prefix: "/admin/menus", roles: ["admin", "chef"] },
  { prefix: "/admin/pricelist", roles: ["admin"] },
  { prefix: "/admin/users", roles: ["admin"] },
];

function logRequest(
  request: NextRequest,
  response: NextResponse,
  startedAt: number,
  reason: string,
) {
  const durationMs = Date.now() - startedAt;
  const { pathname, search } = request.nextUrl;
  const log = {
    event: "frontend_request",
    method: request.method,
    path: `${pathname}${search}`,
    status: response.status,
    reason,
    duration_ms: durationMs,
  };

  console.log(JSON.stringify(log));
  return response;
}

function isPublicRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  return publicPrefixes.some((prefix) => pathname.startsWith(prefix));
}

function getBaseUrl(request: NextRequest): string {
  if (process.env.NODE_ENV === "production") {
    return "http://localhost:3000";
  }
  return request.nextUrl.origin;
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", pathname);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete("dapur-buwikra.session_token");
  response.cookies.delete("dapur-buwikra.session_data");
  return response;
}

export async function middleware(request: NextRequest) {
  const startedAt = Date.now();
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/v1")) {
    return logRequest(
      request,
      NextResponse.next(),
      startedAt,
      "api_passthrough",
    );
  }

  if (isPublicRoute(pathname)) {
    return logRequest(request, NextResponse.next(), startedAt, "public");
  }

  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: "dapur-buwikra",
  });

  if (!sessionCookie) {
    return logRequest(
      request,
      redirectToLogin(request, pathname),
      startedAt,
      "no_session",
    );
  }

  const protectedRoute = routeRoles.find((route) =>
    pathname.startsWith(route.prefix),
  );
  if (!protectedRoute) {
    return logRequest(request, NextResponse.next(), startedAt, "authenticated");
  }

  try {
    const baseUrl = getBaseUrl(request);
    const sessionResponse = await fetch(`${baseUrl}/api/auth/get-session`, {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    });

    if (!sessionResponse.ok) {
      return logRequest(
        request,
        redirectToLogin(request, pathname),
        startedAt,
        "session_lookup_failed",
      );
    }

    const session = await sessionResponse.json();

    if (!session?.user) {
      return logRequest(
        request,
        redirectToLogin(request, pathname),
        startedAt,
        "missing_user",
      );
    }

    if (!protectedRoute.roles.includes(session.user.role)) {
      return logRequest(
        request,
        NextResponse.redirect(new URL("/dashboard", request.url)),
        startedAt,
        "forbidden_role",
      );
    }

    return logRequest(request, NextResponse.next(), startedAt, "authorized");
  } catch (error) {
    console.error("Middleware auth error:", error);
    return logRequest(
      request,
      redirectToLogin(request, pathname),
      startedAt,
      "auth_error",
    );
  }
}

export const config = {
  matcher: [
    "/((?!api/v1|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
