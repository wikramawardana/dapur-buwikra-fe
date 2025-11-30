import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

// Routes that don't require authentication
const publicRoutes = ["/login", "/api/auth"];

// Routes that require admin role
const adminRoutes = ["/admin"];

// Get the base URL for internal API calls
function getBaseUrl(request: NextRequest): string {
  // In production, use the internal URL (localhost) to avoid DNS/network issues
  // The app runs on port 3000 inside the container
  if (process.env.NODE_ENV === "production") {
    return "http://localhost:3000";
  }
  // In development, use the request URL
  return request.nextUrl.origin;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    // Redirect to login if no session
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For session validation and role checking, we need to call the auth API
  try {
    const baseUrl = getBaseUrl(request);
    const sessionResponse = await fetch(
      `${baseUrl}/api/auth/get-session`,
      {
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      },
    );

    if (!sessionResponse.ok) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const session = await sessionResponse.json();

    if (!session || !session.user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const userRole = session.user.role;

    // Check if user has no role or role is "user" (no access)
    if (!userRole || userRole === "user") {
      // Redirect to unauthorized page if trying to access protected routes
      if (pathname !== "/unauthorized") {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
    }

    // Check admin routes
    if (adminRoutes.some((route) => pathname.startsWith(route))) {
      if (userRole !== "admin") {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware auth error:", error);
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
