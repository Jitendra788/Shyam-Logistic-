import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, hasValidSessionCookie } from "@/lib/auth-edge";

function isPublicApi(req: NextRequest) {
  const method = req.method.toUpperCase();
  const path = req.nextUrl.pathname;
  const q = req.nextUrl.searchParams;

  if (path === "/api/auth/login" && method === "POST") return true;
  if (path === "/api/auth/logout" && method === "POST") return true;
  if (path === "/api/auth/me" && method === "GET") return true;
  if (path === "/api/settings" && method === "GET") return true;
  if (path === "/api/enquiries" && method === "POST") return true;
  if (path === "/api/posts" && method === "GET" && q.get("all") !== "1") {
    return true;
  }
  return false;
}

function denyApi() {
  return NextResponse.json(
    { error: "Unauthorized", login: true },
    {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  const authed = await hasValidSessionCookie(token);

  if (pathname.startsWith("/api/")) {
    if (isPublicApi(req)) return NextResponse.next();
    if (!authed) return denyApi();
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!authed) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
