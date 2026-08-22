import { NextRequest, NextResponse } from "next/server";
import { getCompanyBySlug } from "@/lib/companies";
import { COMPANY_COOKIE_NAME, createCompanySessionToken, verifyCompanyPassword } from "@/lib/companyAuth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const slug = typeof body?.slug === "string" ? body.slug : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const company = slug ? await getCompanyBySlug(slug) : null;
  if (!company?.passwordHash || !password || !(await verifyCompanyPassword(password, company.passwordHash))) {
    return NextResponse.json(
      { error: "invalid_password", message: "Incorrect password." },
      { status: 401 },
    );
  }

  // Also returned in the JSON body (not just set as a cookie) so a mobile
  // client with no reliable persistent cookie jar can store it and send it
  // back as `Authorization: Bearer <token>` instead — see lib/authToken.ts.
  const token = createCompanySessionToken(company.id, company.passwordHash);
  const res = NextResponse.json({ ok: true, token, companyId: company.id, slug: company.slug });
  res.cookies.set(COMPANY_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
