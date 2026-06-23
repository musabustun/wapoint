import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isSuperAdminRoute = pathname.startsWith("/super-admin");
  const isLoginPage = pathname === "/super-admin/login";
  const isApiAuth = pathname.startsWith("/api/auth");

  if (isApiAuth) return NextResponse.next();

  if (isSuperAdminRoute && !isLoginPage && !session) {
    const loginUrl = new URL("/super-admin/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginPage && session) {
    return NextResponse.redirect(new URL("/super-admin", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/super-admin/:path*"],
};
