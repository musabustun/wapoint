import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isSuperAdmin = pathname.startsWith("/super-admin");
  const isSuperAdminLogin = pathname === "/super-admin/login";
  const isBarber = pathname.startsWith("/barber");
  const isBarberLogin = pathname === "/barber/login";

  if (!isSuperAdmin && !isBarber) return NextResponse.next();

  let session = null;
  try {
    session = await auth();
  } catch {
    // auth() threw — treat as unauthenticated
  }

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
}

export const config = {
  matcher: ["/super-admin/:path*", "/barber/:path*"],
};
