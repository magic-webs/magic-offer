import type { NextRequest } from "next/server";

// Reads a session token from either its named cookie (what the web app
// uses) or a `Authorization: Bearer <token>` header (what a mobile client
// sends instead, after storing the token value /api/admin/login or
// /api/company/login hands back in the JSON body — React Native has no
// reliable persistent cookie jar to lean on the way a browser does).
export function extractToken(req: NextRequest, cookieName: string): string | undefined {
  const cookieValue = req.cookies.get(cookieName)?.value;
  if (cookieValue) return cookieValue;

  const header = req.headers.get("authorization");
  if (header?.startsWith("Bearer ")) {
    const token = header.slice(7).trim();
    return token || undefined;
  }

  return undefined;
}
