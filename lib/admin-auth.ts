import { jwtVerify } from "jose";

export const adminCookie = "boho_token";
export const adminSessionSeconds = 60 * 60;

export function adminSecret() {
  const secret = process.env.BOHO_SECRET;
  return secret && secret.length >= 32 ? new TextEncoder().encode(secret) : null;
}

export async function isAdmin(token?: string) {
  const secret = adminSecret();
  if (!secret || !token) return false;

  try {
    await jwtVerify(token, secret, {
      algorithms: ["HS256"],
      requiredClaims: ["exp"],
    });
    return true;
  } catch {
    return false;
  }
}
