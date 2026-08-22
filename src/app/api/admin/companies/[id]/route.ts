import { NextRequest, NextResponse } from "next/server";
import { getCompanyWithDetails, resolveCompanyAccess, updateCompany } from "@/lib/companies";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await resolveCompanyAccess(req, id))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
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
    hasPassword: Boolean(company.passwordHash),
    wheelImageUrl: company.wheelImage?.url ?? null,
    bgImageUrl: company.bgImage?.url ?? null,
    pinImageUrl: company.pinImage?.url ?? null,
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
    fields: (company.formFields ?? [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((f) => ({
        id: f.id,
        key: f.key,
        label: f.label,
        required: f.required,
        order: f.order,
      })),
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await resolveCompanyAccess(req, id))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const patch: { name?: string; isActive?: boolean; askName?: boolean; askPhone?: boolean } = {};
  if (typeof body?.name === "string" && body.name.trim()) patch.name = body.name.trim();
  if (typeof body?.isActive === "boolean") patch.isActive = body.isActive;
  if (typeof body?.askName === "boolean") patch.askName = body.askName;
  if (typeof body?.askPhone === "boolean") patch.askPhone = body.askPhone;

  await updateCompany(id, patch);
  return NextResponse.json({ ok: true });
}
