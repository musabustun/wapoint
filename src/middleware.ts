import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isSuperAdmin = pathname.startsWith("/super-admin");
  const isSuperAdminLogin = pathname === "/super-admin/login";
  const isBarber = pathname.startsWith("/barber");
  const isBarberLogin = pathname === "/barber/login";
  const isApiAuth = pathname.startsWith("/api/auth");

  if (isApiAuth) return NextResponse.next();

  if (isSuperAdmin && !isSuperAdminLogin && !session) {
    const loginUrl = new URL("/super-admin/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
  if (isSuperAdminLogin && session) {
    return NextResponse.redirect(new URL("/super-admin", req.url));
  }

  if (isBarber && !isBarberLogin && !session) {
    const loginUrl = new URL("/barber/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
  if (isBarberLogin && session) {
    return NextResponse.redirect(new URL("/barber", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/super-admin/:path*", "/barber/:path*"],
};
