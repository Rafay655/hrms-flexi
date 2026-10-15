import { NextRequest, NextResponse } from "next/server";

const publicRoutes = [
  "/auth/login",
  "/auth/forgot-password",
  "/auth/reset-password",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("accessToken")?.value;

  console.log("Middleware: token:", token, "pathname:", pathname);

  // ── Root path handling ─────────────────────────
  if (pathname === "/") {
    if (token) {
      return NextResponse.redirect(new URL("/flexi-hq", request.url));
    }
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // ── Public auth routes ─────────────────────────
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // No token and not public → login
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Token exists and not public → validate
  if (token && !isPublicRoute) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/validate-token`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const isValid = data?.data?.valid === true;

      if (!isValid) {
        const response = NextResponse.redirect(new URL("/auth/login", request.url));
        response.cookies.delete("accessToken");
        response.cookies.delete("companyId");
        return response;
      }
      return NextResponse.next();
    } catch {
      const response = NextResponse.redirect(new URL("/auth/login", request.url));
      response.cookies.delete("accessToken");
      return response;
    }
  }

  // Logged-in user hitting login page → app
  if (token && pathname === "/auth/login") {
    return NextResponse.redirect(new URL("/flexi-hq", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclude Firebase service worker and other static assets
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|logo|avatars|firebase-messaging-sw\\.js).*)",
  ],
};