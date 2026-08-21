import { NextRequest, NextResponse } from "next/server";
import { init } from "@instantdb/admin";
import schema from "@/instant.schema";
import { drawWeightedPrize } from "@/lib/prizes";

const adminDb = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
  adminToken: process.env.INSTANT_APP_ADMIN_TOKEN!,
  schema,
});

// The spin itself is identified purely by the token from /api/register —
// the name and phone are already on file, so nothing re-enters them here.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.trim() : "";

  if (!token) {
    return NextResponse.json(
      { error: "invalid_input", message: "Missing session token." },
      { status: 400 },
    );
  }

  const { spins } = await adminDb.query({ spins: { $: { where: { token } } } });
  const record = spins[0];
  if (!record) {
    return NextResponse.json(
      { error: "not_found", message: "Your link has expired. Please register again." },
      { status: 404 },
    );
  }

  if (record.prizeId) {
    return NextResponse.json({
      alreadySpun: true,
      prizeId: record.prizeId,
      prizeLabel: record.prizeLabel,
    });
  }

  const prize = drawWeightedPrize();

  try {
    await adminDb.transact(
      adminDb.tx.spins[record.id].update({
        prizeId: prize.id,
        prizeLabel: prize.label,
      }),
    );
  } catch {
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    alreadySpun: false,
    prizeId: prize.id,
    prizeLabel: prize.label,
  });
}
