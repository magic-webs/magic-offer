import { NextRequest, NextResponse } from "next/server";
import { id as generateId } from "@instantdb/admin";
import { adminDb, getCompanyWithDetails, resolveCompanyAccess, slugifyFieldKey } from "@/lib/companies";

interface FieldInput {
  id?: string;
  label: string;
  required: boolean;
}

// Saves the whole extra-fields list for a company atomically, mirroring
// the prizes PUT route: existing rows (matched by id) are updated — their
// `key` is kept unchanged so already-collected answers keep resolving —
// new rows (no id) are created with a fresh, deduped key derived from the
// label, and any existing row not present in the submitted array is
// deleted. `order` is assigned from array position. Unlike prizes, an
// empty list is valid (extra fields are optional).
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: companyId } = await params;
  if (!(await resolveCompanyAccess(req, companyId))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const input: FieldInput[] = Array.isArray(body?.fields) ? body.fields : [];

  const cleaned = input
    .map((f) => ({
      id: typeof f.id === "string" ? f.id : undefined,
      label: typeof f.label === "string" ? f.label.trim() : "",
      required: Boolean(f.required),
    }))
    .filter((f) => f.label.length > 0);

  const company = await getCompanyWithDetails(companyId);
  if (!company) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const existing = company.formFields ?? [];
  const existingById = new Map(existing.map((f) => [f.id, f]));
  const keptIds = new Set(cleaned.filter((f) => f.id).map((f) => f.id!));
  const toDelete = existing.filter((f) => !keptIds.has(f.id)).map((f) => f.id);

  const usedKeys = new Set(existing.filter((f) => keptIds.has(f.id)).map((f) => f.key));

  const txs = [
    ...toDelete.map((existingId) => adminDb.tx.formFields[existingId].delete()),
    ...cleaned.map((f, order) => {
      const prior = f.id ? existingById.get(f.id) : undefined;
      if (prior) {
        return adminDb.tx.formFields[prior.id].update({
          label: f.label,
          required: f.required,
          order,
          key: prior.key,
        });
      }

      const base = slugifyFieldKey(f.label);
      let key = base;
      let suffix = 2;
      while (usedKeys.has(key)) {
        key = `${base}-${suffix}`;
        suffix += 1;
      }
      usedKeys.add(key);

      const fieldId = generateId();
      return adminDb.tx.formFields[fieldId]
        .update({ label: f.label, required: f.required, order, key, companyId, createdAt: Date.now() })
        .link({ company: companyId });
    }),
  ];

  await adminDb.transact(txs);
  return NextResponse.json({ ok: true });
}
