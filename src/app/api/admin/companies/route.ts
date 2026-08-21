import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isValidAdminSessionToken } from "@/lib/adminAuth";
import { createCompany, getCompanyBySlug, listCompaniesWithSpinCounts } from "@/lib/companies";

function checkAuth(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  return isValidAdminSessionToken(token);
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const slug = req.nextUrl.searchParams.get("slug");
  if (slug) {
    const company = await getCompanyBySlug(slug);
    if (!company) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ company });
  }

  const companies = await listCompaniesWithSpinCounts();
  return NextResponse.json({ companies });
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json(
      { error: "invalid_input", message: "Company name is required." },
      { status: 400 },
    );
  }

  const company = await createCompany(name);
  return NextResponse.json({ company });
}
