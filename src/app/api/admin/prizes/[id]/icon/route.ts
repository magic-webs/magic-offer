import { NextRequest, NextResponse } from "next/server";
import { adminDb, resolveCompanyAccess } from "@/lib/companies";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: prizeId } = await params;

  const { prizes } = await adminDb.query({ prizes: { $: { where: { id: prizeId } } } });
  const prize = prizes[0];
  if (!prize) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (!(await resolveCompanyAccess(req, prize.companyId))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "invalid_input", message: "No file provided." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { data } = await adminDb.storage.uploadFile(
    `companies/${prize.companyId}/prizes/${prizeId}/icon`,
    buffer,
    { contentType: file.type || "image/png" },
  );
  await adminDb.transact(adminDb.tx.prizes[prizeId].link({ icon: data.id }));

  return NextResponse.json({ ok: true });
}
