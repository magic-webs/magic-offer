import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isValidAdminSessionToken } from "@/lib/adminAuth";
import { getCompanyWithDetails, updateCompany } from "@/lib/companies";

function checkAuth(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  return isValidAdminSessionToken(token);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const company = await getCompanyWithDetails(id);
  if (!company) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    id: company.id,
    slug: company.slug,
    name: company.name,
    isActive: company.isActive,
    askName: company.askName,
    askPhone: company.askPhone,
    wheelImageUrl: company.wheelImage?.url ?? null,
    prizes: (company.prizes ?? [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((p) => ({
        id: p.id,
        label: p.label,
        weight: p.weight,
        color: p.color ?? null,
        order: p.order,
        isWin: p.isWin,
        iconUrl: p.icon?.url ?? null,
      })),
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const patch: { name?: string; isActive?: boolean; askName?: boolean; askPhone?: boolean } = {};
  if (typeof body?.name === "string" && body.name.trim()) patch.name = body.name.trim();
  if (typeof body?.isActive === "boolean") patch.isActive = body.isActive;
  if (typeof body?.askName === "boolean") patch.askName = body.askName;
  if (typeof body?.askPhone === "boolean") patch.askPhone = body.askPhone;

  await updateCompany(id, patch);
  return NextResponse.json({ ok: true });
}
