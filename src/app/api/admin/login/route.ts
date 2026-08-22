import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, createAdminSessionToken, isCorrectAdminPassword } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!password || !isCorrectAdminPassword(password)) {
    return NextResponse.json(
      { error: "invalid_password", message: "Incorrect password." },
      { status: 401 },
    );
  }

  // Also returned in the JSON body (not just set as a cookie) so a mobile
  // client with no reliable persistent cookie jar can store it and send it
  // back as `Authorization: Bearer <token>` instead — see lib/authToken.ts.
  const token = createAdminSessionToken();
  const res = NextResponse.json({ ok: true, token });
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
