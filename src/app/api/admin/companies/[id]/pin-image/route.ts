import { NextRequest, NextResponse } from "next/server";
import { adminDb, resolveCompanyAccess } from "@/lib/companies";

// Fixed path per company so re-uploading overwrites the previous image in
// place instead of accumulating orphaned $files rows.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: companyId } = await params;
  if (!(await resolveCompanyAccess(req, companyId))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "invalid_input", message: "No file provided." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { data } = await adminDb.storage.uploadFile(`companies/${companyId}/pin-image`, buffer, {
    contentType: file.type || "image/png",
  });
  await adminDb.transact(adminDb.tx.companies[companyId].link({ pinImage: data.id }));

  return NextResponse.json({ ok: true });
}
