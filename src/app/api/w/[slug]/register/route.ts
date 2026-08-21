import { NextRequest, NextResponse } from "next/server";
import { getCompanyBySlug, getFormFields } from "@/lib/companies";
import { registerSpin } from "@/lib/registerSpin";

// Company-scoped equivalent of /api/register — see that file for the
// legacy/default-company route this mirrors.
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company || !company.isActive) {
    return NextResponse.json({ error: "not_found", message: "This wheel isn't available." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const fields = await getFormFields(company.id);
  const result = await registerSpin({
    companyId: company.id,
    companySlug: company.slug,
    name: typeof body?.name === "string" ? body.name : null,
    phone: typeof body?.phone === "string" ? body.phone : null,
    token: typeof body?.token === "string" ? body.token : null,
    extraFields: typeof body?.extraFields === "object" && body.extraFields ? body.extraFields : undefined,
    settings: { askName: company.askName, askPhone: company.askPhone },
    fields,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error, message: result.message }, { status: result.status });
  }
  return NextResponse.json({ token: result.token, loginUrl: result.loginUrl });
}
