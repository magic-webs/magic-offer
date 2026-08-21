import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { init, id } from "@instantdb/admin";
import schema from "@/instant.schema";

const adminDb = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
  adminToken: process.env.INSTANT_APP_ADMIN_TOKEN!,
  schema,
});

const PHONE_RE = /^[0-9+][0-9\s-]{6,14}$/;

function generateToken() {
  return randomBytes(9).toString("base64url");
}

// Registers a name+phone once and hands back a token that acts as a magic
// link: revisiting `/?t=<token>` (see /api/session) skips this form
// entirely, whether or not the person has spun yet.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";

  if (!name || !phone) {
    return NextResponse.json(
      { error: "invalid_input", message: "Name and phone number are required." },
      { status: 400 },
    );
  }
  if (!PHONE_RE.test(phone)) {
    return NextResponse.json(
      { error: "invalid_input", message: "Enter a valid phone number." },
      { status: 400 },
    );
  }

  const existing = await adminDb.query({ spins: { $: { where: { phone } } } });
  if (existing.spins.length > 0) {
    const prev = existing.spins[0];
    if (prev.token) {
      return NextResponse.json({ token: prev.token });
    }
    // Pre-existing row from before tokens existed — attach one now.
    const token = generateToken();
    await adminDb.transact(adminDb.tx.spins[prev.id].update({ token }));
    return NextResponse.json({ token });
  }

  const token = generateToken();
  try {
    await adminDb.transact(
      adminDb.tx.spins[id()].update({
        name,
        phone,
        token,
        createdAt: Date.now(),
      }),
    );
  } catch {
    // Race on the unique `phone` index — someone else's request for the
    // same number landed first. Fetch their token instead of erroring.
    const existingAfterRace = await adminDb.query({ spins: { $: { where: { phone } } } });
    const prev = existingAfterRace.spins[0];
    if (prev?.token) {
      return NextResponse.json({ token: prev.token });
    }
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ token });
}
