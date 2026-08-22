import { NextRequest, NextResponse } from "next/server";
import { resolveCompanyAccess, setCompanyPassword } from "@/lib/companies";
import { hashCompanyPassword } from "@/lib/companyAuth";

// Either the platform admin or the company itself (already logged in) can
// set/change/clear this company's own login password.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: companyId } = await params;
  if (!(await resolveCompanyAccess(req, companyId))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password.trim() : "";

  if (!password) {
    await setCompanyPassword(companyId, null);
    return NextResponse.json({ ok: true, hasPassword: false });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "invalid_input", message: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  await setCompanyPassword(companyId, await hashCompanyPassword(password));
  return NextResponse.json({ ok: true, hasPassword: true });
}
