import { NextRequest, NextResponse } from "next/server";
import { adminDb, resolveCompanyAccess } from "@/lib/companies";

export async function POST(req: NextRequest, { params }: { params: Promise<{ offerId: string }> }) {
  const { offerId } = await params;
  
  const { offers } = await adminDb.query({ offers: { $: { where: { id: offerId } } } });
  const offer = offers[0];
  if (!offer) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (!(await resolveCompanyAccess(req, offer.companyId))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const kind = req.nextUrl.searchParams.get("kind");
  if (kind !== "wheel" && kind !== "bg" && kind !== "pin") {
    return NextResponse.json(
      { error: "invalid_input", message: "Invalid image kind. Must be wheel, bg, or pin." },
      { status: 400 },
    );
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "invalid_input", message: "No file provided." }, { status: 400 });
  }

  const linkField = kind === "wheel" ? "wheelImage" : kind === "bg" ? "bgImage" : "pinImage";
  const buffer = Buffer.from(await file.arrayBuffer());
  
  const { data } = await adminDb.storage.uploadFile(`offers/${offerId}/${kind}-image`, buffer, {
    contentType: file.type || "image/png",
  });

  await adminDb.transact(adminDb.tx.offers[offerId].link({ [linkField]: data.id }));

  return NextResponse.json({ ok: true });
}
