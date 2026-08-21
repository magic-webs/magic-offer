import { NextRequest, NextResponse } from "next/server";
import { init } from "@instantdb/admin";
import schema from "@/instant.schema";

const adminDb = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
  adminToken: process.env.INSTANT_APP_ADMIN_TOKEN!,
  schema,
});

// Resolves a magic-link token back to who registered it, so the spin page
// can greet a returning visitor by name without ever asking for their
// phone number again.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.json(
      { error: "invalid_input", message: "Missing token." },
      { status: 400 },
    );
  }

  const { spins } = await adminDb.query({ spins: { $: { where: { token } } } });
  const record = spins[0];
  if (!record) {
    return NextResponse.json({ error: "not_found", message: "Link not found." }, { status: 404 });
  }

  return NextResponse.json({
    name: record.name,
    // Never surface the private anon-<hex> placeholder minted when
    // askPhone was off at registration time — it's not a real phone number.
    phone: record.phone.startsWith("anon-") ? null : record.phone,
    hasSpun: Boolean(record.prizeId),
    prizeId: record.prizeId ?? null,
    prizeLabel: record.prizeLabel ?? null,
    extraFields: record.extraFields ?? {},
  });
}
