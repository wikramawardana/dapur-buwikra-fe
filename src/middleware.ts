import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

const publicPrefixes = ["/login", "/api/auth"];
const adminRoutes = ["/admin"];

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
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/v1")) {
    return NextResponse.next();
  }

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: "dapur-buwikra",
  });

  if (!sessionCookie) {
    return redirectToLogin(request, pathname);
  }

  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  if (!isAdminRoute) {
    return NextResponse.next();
  }

  try {
    const baseUrl = getBaseUrl(request);
    const sessionResponse = await fetch(`${baseUrl}/api/auth/get-session`, {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    });

    if (!sessionResponse.ok) {
      return redirectToLogin(request, pathname);
    }

    const session = await sessionResponse.json();

    if (!session?.user) {
      return redirectToLogin(request, pathname);
    }

    if (session.user.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware auth error:", error);
    return redirectToLogin(request, pathname);
  }
}

export const config = {
  matcher: [
    "/((?!api/v1|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
