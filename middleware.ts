import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isLegacyLocalePrefix } from "@/lib/i18n/config";

function isAdminAuthenticated(request: NextRequest): boolean {
  const authCookie = request.cookies.get("admin_auth");
  if (!authCookie) return false;
  try {
    const decoded = Buffer.from(authCookie.value, "base64").toString();
    const [user, password] = decoded.split(":");
    return (
      user === process.env.ADMIN_USER && password === process.env.ADMIN_PASS
    );
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const authed = isAdminAuthenticated(request);
    const isLogin = pathname === "/admin/login";

    if (authed && isLogin) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (!authed && !isLogin) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  const first = pathname.split("/")[1] || "";

  if (isLegacyLocalePrefix(first)) {
    const url = request.nextUrl.clone();
    const stripped =
      pathname.length <= first.length + 1
        ? "/"
        : pathname.slice(first.length + 1);
    url.pathname = stripped;
    return NextResponse.redirect(url, 308);
  }

  if (pathname.startsWith("/feeds/google/uk") || pathname === "/feeds/google/uk.xml") {
    const url = request.nextUrl.clone();
    url.pathname = "/feeds/google.xml";
    return NextResponse.redirect(url, 308);
  }
  if (pathname.startsWith("/feeds/meta/uk") || pathname === "/feeds/meta/uk.xml") {
    const url = request.nextUrl.clone();
    url.pathname = "/feeds/meta.xml";
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/((?!api|_next/static|_next/image|favicon.ico|assets/|admin-icons/|feeds/|robots.txt|sitemap.xml|site.webmanifest|sw.js|.*\\..*).*)",
  ],
};
