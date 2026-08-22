import { NextRequest, NextResponse } from "next/server";
import { resolveCompanyAccess, setCompanyPassword } from "@/lib/companies";
import { hashCompanyPassword } from "@/lib/companyAuth";

// Either the platform admin or the company itself (already logged in) can
// set/change this company's own login password. Clearing it entirely is
// admin-only — a company could otherwise lock itself out with no way back
// in except asking the admin anyway, so there's no point letting it happen
// by accident from the company's own side.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: companyId } = await params;
  const role = await resolveCompanyAccess(req, companyId);
  if (!role) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password.trim() : "";

  if (!password) {
    if (role !== "admin") {
      return NextResponse.json({ error: "unauthorized" }, { status: 403 });
    }
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
