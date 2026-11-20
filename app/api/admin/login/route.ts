import { timingSafeEqual } from "node:crypto";
import { SignJWT } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { adminCookie, adminSecret, adminSessionSeconds } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const expected = process.env.BOHO_PASSWORD;
  const secret = adminSecret();
  if (!expected || !secret) {
    return NextResponse.json({ error: "Admin sign-in is unavailable" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const provided = Buffer.from(typeof body?.password === "string" ? body.password : "");
  const expectedBytes = Buffer.from(expected);
  if (provided.length !== expectedBytes.length || !timingSafeEqual(provided, expectedBytes)) {
    return NextResponse.json({ error: "Invalid password. Please try again." }, { status: 401 });
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + adminSessionSeconds)
    .sign(secret);

  const response = NextResponse.json({ success: true });
  response.cookies.set(adminCookie, token, {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:" || process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: adminSessionSeconds,
    path: "/",
  });
  return response;
}
