import { NextRequest, NextResponse } from "next/server";
import { getDefaultCompany } from "@/lib/companies";
import { getSettings } from "@/lib/settingsStore";
import { registerSpin } from "@/lib/registerSpin";

// Registers a person once and hands back a token that acts as a magic
// link: revisiting `/?t=<token>` (see /api/session) skips the popup
// entirely, whether or not they've spun yet. This is the legacy, unnamed
// "default" company's endpoint — its URL/contract never changes, since an
// existing external CRM/WhatsApp integration calls it directly. Other
// companies use /api/w/[slug]/register instead.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const company = await getDefaultCompany();
  if (!company) {
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  const settings = await getSettings();
  const result = await registerSpin({
    companyId: company.id,
    companySlug: null,
    name: typeof body?.name === "string" ? body.name : null,
    phone: typeof body?.phone === "string" ? body.phone : null,
    settings,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error, message: result.message }, { status: result.status });
  }
  return NextResponse.json({ token: result.token, loginUrl: result.loginUrl });
}
