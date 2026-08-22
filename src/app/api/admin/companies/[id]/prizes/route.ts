import { NextRequest, NextResponse } from "next/server";
import { id as generateId } from "@instantdb/admin";
import { adminDb, getCompanyWithDetails, resolveCompanyAccess } from "@/lib/companies";

interface PrizeInput {
  id?: string;
  label: string;
  weight: number;
  isWin: boolean;
  color?: string | null;
}

// Saves the whole prize list for a company atomically: existing rows
// (matched by id) are updated, new rows (no id) are created, and any
// existing row not present in the submitted array is deleted. `order` is
// assigned from array position.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: companyId } = await params;
  if (!(await resolveCompanyAccess(req, companyId))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const input: PrizeInput[] = Array.isArray(body?.prizes) ? body.prizes : [];

  const cleaned = input
    .map((p) => ({
      id: typeof p.id === "string" ? p.id : undefined,
      label: typeof p.label === "string" ? p.label.trim() : "",
      weight: Number.isFinite(p.weight) ? Math.max(0, Number(p.weight)) : 0,
      isWin: Boolean(p.isWin),
      color: typeof p.color === "string" && p.color ? p.color : undefined,
    }))
    .filter((p) => p.label.length > 0);

  if (cleaned.length === 0) {
    return NextResponse.json(
      { error: "invalid_input", message: "At least one prize is required." },
      { status: 400 },
    );
  }

  const company = await getCompanyWithDetails(companyId);
  if (!company) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const existingIds = new Set((company.prizes ?? []).map((p) => p.id));
  const keptIds = new Set(cleaned.filter((p) => p.id).map((p) => p.id!));
  const toDelete = [...existingIds].filter((existingId) => !keptIds.has(existingId));

  const txs = [
    ...toDelete.map((existingId) => adminDb.tx.prizes[existingId].delete()),
    ...cleaned.map((p, order) => {
      const prizeId = p.id ?? generateId();
      const update = adminDb.tx.prizes[prizeId].update({
        label: p.label,
        weight: p.weight,
        isWin: p.isWin,
        color: p.color,
        order,
        companyId,
        ...(p.id ? {} : { createdAt: Date.now() }),
      });
      return p.id ? update : update.link({ company: companyId });
    }),
  ];

  await adminDb.transact(txs);
  return NextResponse.json({ ok: true });
}
