import { createHmac, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

const COOKIE_NAME = "company_session";
const SESSION_LABEL = "company-session-v1";
const KEY_LENGTH = 64;

function serverSecret() {
  // Reuses the platform admin password as HMAC key material so company
  // sessions don't need a separate secret to provision — it's never sent
  // anywhere, only used to sign/verify locally.
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error("ADMIN_PASSWORD is not set.");
  return secret;
}

export async function hashCompanyPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyCompanyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;
  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  const expected = Buffer.from(hashHex, "hex");
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

function sign(companyId: string, passwordHash: string) {
  return createHmac("sha256", serverSecret())
    .update(`${SESSION_LABEL}:${companyId}:${passwordHash}`)
    .digest("hex");
}

// The token embeds the passwordHash's signature, not the company id's
// identity alone — so changing or clearing a company's password
// invalidates every session token issued for it, with no session store.
export function createCompanySessionToken(companyId: string, passwordHash: string) {
  return `${companyId}.${sign(companyId, passwordHash)}`;
}

export function readCompanySessionToken(
  token: string | undefined | null,
  passwordHash: string | null | undefined,
): string | null {
  if (!token || !passwordHash) return null;
  const dot = token.indexOf(".");
  if (dot === -1) return null;
  const companyId = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = sign(companyId, passwordHash);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return companyId;
}

export { COOKIE_NAME as COMPANY_COOKIE_NAME };
