import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isValidAdminSessionToken } from "@/lib/adminAuth";
import { adminDb } from "@/lib/companies";

function checkAuth(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  return isValidAdminSessionToken(token);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id: companyId } = await params;

  const { spins } = await adminDb.query({
    spins: { $: { where: { companyId }, order: { createdAt: "desc" } } },
  });

  return NextResponse.json({
    spins: spins.map((s) => ({
      id: s.id,
      name: s.name,
      phone: s.phone,
      prizeLabel: s.prizeLabel ?? null,
      createdAt: s.createdAt,
    })),
  });
}
