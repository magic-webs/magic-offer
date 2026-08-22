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

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COMPANY_COOKIE_NAME, createCompanySessionToken(company.id, company.passwordHash), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
