import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { extractToken } from "@/lib/authToken";

const COOKIE_NAME = "admin_session";
const SESSION_LABEL = "admin-session-v1";

function sign(secret: string) {
  return createHmac("sha256", secret).update(SESSION_LABEL).digest("hex");
}

// Stateless session: the cookie is just an HMAC of a fixed label keyed by
// the admin password. No session store needed, and it can't be forged
// without knowing ADMIN_PASSWORD — but note it also never expires on its
// own, so treat it like a long-lived credential (logout clears it).
export function createAdminSessionToken() {
  return sign(requiredPassword());
}

export function isValidAdminSessionToken(token: string | undefined | null) {
  if (!token) return false;
  const expected = sign(requiredPassword());
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// Accepts either the admin_session cookie (web) or an Authorization:
// Bearer <token> header (mobile) carrying the same token value.
export function isAdminRequestAuthenticated(req: NextRequest): boolean {
  return isValidAdminSessionToken(extractToken(req, COOKIE_NAME));
}

export function isCorrectAdminPassword(password: string) {
  const expected = requiredPassword();
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function requiredPassword() {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) throw new Error("ADMIN_PASSWORD is not set.");
  return pw;
}

export { COOKIE_NAME as ADMIN_COOKIE_NAME };
