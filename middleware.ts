import { NextRequest, NextResponse } from "next/server";
import { adminCookie, isAdmin } from "@/lib/admin-auth";

export async function middleware(request: NextRequest) {
  const onLoginPage = request.nextUrl.pathname === "/admin/login";
  const signedIn = await isAdmin(request.cookies.get(adminCookie)?.value);

  if (onLoginPage === signedIn) {
    return NextResponse.redirect(
      new URL(signedIn ? "/admin" : "/admin/login", request.url),
    );
  }

  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
