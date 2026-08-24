import { NextRequest, NextResponse } from "next/server";
import { id as generateId } from "@instantdb/admin";
import { adminDb, resolveCompanyAccess } from "@/lib/companies";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: companyId } = await params;
  if (!(await resolveCompanyAccess(req, companyId))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { companies } = await adminDb.query({
    companies: {
      $: { where: { id: companyId } },
      offers: {
        $: { order: { createdAt: "desc" } }
      }
    }
  });

  return NextResponse.json({ offers: companies[0]?.offers ?? [] });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: companyId } = await params;
  if (!(await resolveCompanyAccess(req, companyId))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const type = typeof body?.type === "string" ? body.type.trim() : "wheel";
  const event = typeof body?.event === "string" ? body.event.trim() : "none";

  if (!title) {
    return NextResponse.json(
      { error: "invalid_input", message: "Offer title is required." },
      { status: 400 },
    );
  }

  const offerId = generateId();

  await adminDb.transact([
    adminDb.tx.offers[offerId].update({
      title,
      type,
      event,
      isActive: false, // Inactive by default, merchant will activate it manually
      askName: true,
      askPhone: true,
      createdAt: Date.now(),
      companyId,
    }),
    adminDb.tx.offers[offerId].link({ company: companyId })
  ]);

  return NextResponse.json({ offer: { id: offerId, title, type, event, isActive: false } });
}
