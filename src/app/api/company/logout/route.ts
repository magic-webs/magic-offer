import { NextResponse } from "next/server";
import { COMPANY_COOKIE_NAME } from "@/lib/companyAuth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COMPANY_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
