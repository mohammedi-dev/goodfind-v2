import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminCookie, isAdmin } from "@/lib/admin-auth";

export async function hasAdminSession() {
  return isAdmin((await cookies()).get(adminCookie)?.value);
}

export async function adminApiDenied() {
  if (await hasAdminSession()) return;
  return NextResponse.json({ error: "Admin sign-in required" }, { status: 401 });
}
