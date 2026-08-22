import { NextRequest, NextResponse } from "next/server";
import { adminDb, resolveCompanyAccess } from "@/lib/companies";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: companyId } = await params;
  if (!(await resolveCompanyAccess(req, companyId))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { spins } = await adminDb.query({
    spins: { $: { where: { companyId }, order: { createdAt: "desc" } } },
  });

  return NextResponse.json({
    spins: spins.map((s) => ({
      id: s.id,
      name: s.name,
      phone: s.phone,
      prizeLabel: s.prizeLabel ?? null,
      extraFields: s.extraFields ?? {},
      createdAt: s.createdAt,
    })),
  });
}
