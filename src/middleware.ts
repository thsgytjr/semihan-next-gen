import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Public paths that don't require authentication
const publicPaths = ["/login", "/signup"];

function isPublicPath(pathname: string): boolean {
  // Remove locale prefix to check path
  const pathWithoutLocale = pathname.replace(/^\/(ko|en)/, "") || "/";
  return publicPaths.some((p) => pathWithoutLocale.startsWith(p));
}

export async function middleware(request: NextRequest) {
  // 1. Refresh Supabase session
  const { user, supabaseResponse } = await updateSession(request);

  const pathname = request.nextUrl.pathname;

  // 2. If not authenticated and trying to access protected route, redirect to login
  if (!user && !isPublicPath(pathname)) {
    // Determine locale from URL or default
    const locale =
      routing.locales.find((l) => pathname.startsWith(`/${l}`)) ||
      routing.defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. If authenticated and trying to access login page, redirect to dashboard
  if (user && isPublicPath(pathname)) {
    const locale =
      routing.locales.find((l) => pathname.startsWith(`/${l}`)) ||
      routing.defaultLocale;
    return NextResponse.redirect(
      new URL(`/${locale}/dashboard`, request.url)
    );
  }

  // 4. Run next-intl middleware and merge cookies
  const intlResponse = intlMiddleware(request);

  // Copy Supabase cookies to intl response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value, {
      ...cookie,
    });
  });

  return intlResponse;
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - api routes
    // - _next (Next.js internals)
    // - static files (images, etc.)
    "/((?!api|_next|.*\\..*).*)",
  ],
};
