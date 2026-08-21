import { NextRequest, NextResponse } from "next/server";
import { init } from "@instantdb/admin";
import schema from "@/instant.schema";
import { ADMIN_COOKIE_NAME, isValidAdminSessionToken } from "@/lib/adminAuth";

const adminDb = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
  adminToken: process.env.INSTANT_APP_ADMIN_TOKEN!,
  schema,
});

export async function GET(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!isValidAdminSessionToken(token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { spins } = await adminDb.query({
    spins: { $: { order: { createdAt: "desc" } } },
  });

  return NextResponse.json({
    spins: spins.map((s) => ({
      id: s.id,
      name: s.name,
      phone: s.phone,
      prizeId: s.prizeId ?? null,
      prizeLabel: s.prizeLabel ?? null,
      createdAt: s.createdAt,
    })),
  });
}
