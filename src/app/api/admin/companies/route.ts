import { NextRequest, NextResponse } from "next/server";
import { isAdminRequestAuthenticated } from "@/lib/adminAuth";
import { createCompany, getCompanyBySlug, listCompaniesWithSpinCounts, resolveCompanyAccess } from "@/lib/companies";

// A bare GET (no slug) lists every company and is platform-admin only. A
// GET with `?slug=` looks up a single company by its public slug and is
// how a company's own dashboard resolves its id — so it also accepts a
// company_session scoped to that exact company.
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (slug) {
    const company = await getCompanyBySlug(slug);
    if (!company) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const viewerRole = await resolveCompanyAccess(req, company.id);
    if (!viewerRole) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const { passwordHash, ...safeCompany } = company;
    return NextResponse.json({ company: safeCompany, viewerRole });
  }

  if (!isAdminRequestAuthenticated(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const companies = await listCompaniesWithSpinCounts();
  return NextResponse.json({
    companies: companies.map(({ passwordHash, ...c }) => ({ ...c, hasPassword: Boolean(passwordHash) })),
  });
}

export async function POST(req: NextRequest) {
  if (!isAdminRequestAuthenticated(req)) {
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
