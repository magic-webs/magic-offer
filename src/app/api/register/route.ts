import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { init, id } from "@instantdb/admin";
import schema from "@/instant.schema";
import { getSettings } from "@/lib/settingsStore";
import { buildLoginUrl } from "@/lib/siteUrl";

const adminDb = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
  adminToken: process.env.INSTANT_APP_ADMIN_TOKEN!,
  schema,
});

const PHONE_RE = /^[0-9+][0-9\s-]{6,14}$/;

function generateToken() {
  return randomBytes(9).toString("base64url");
}

// Registers a person once and hands back a token that acts as a magic
// link: revisiting `/?t=<token>` (see /api/session) skips the popup
// entirely, whether or not they've spun yet. Which fields are actually
// required is controlled by the admin settings (askName / askPhone) —
// note that turning `askPhone` off also turns off duplicate-spin
// prevention, since phone is the only identity we ever collect.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const settings = await getSettings();

  let name = typeof body?.name === "string" ? body.name.trim() : "";
  let phone = typeof body?.phone === "string" ? body.phone.trim() : "";

  if (settings.askName && !name) {
    return NextResponse.json(
      { error: "invalid_input", message: "Name is required." },
      { status: 400 },
    );
  }
  name = name || "Guest";

  if (settings.askPhone) {
    if (!phone) {
      return NextResponse.json(
        { error: "invalid_input", message: "Phone number is required." },
        { status: 400 },
      );
    }
    if (!PHONE_RE.test(phone)) {
      return NextResponse.json(
        { error: "invalid_input", message: "Enter a valid phone number." },
        { status: 400 },
      );
    }
  } else {
    // No phone collected — mint a private, never-shown placeholder so the
    // required+unique `phone` field still has a value. Every submission is
    // its own unique "person" in this mode, so there's no duplicate check.
    phone = phone && PHONE_RE.test(phone) ? phone : `anon-${randomBytes(8).toString("hex")}`;
  }

  const existing = await adminDb.query({ spins: { $: { where: { phone } } } });
  if (existing.spins.length > 0) {
    const prev = existing.spins[0];
    if (prev.token) {
      return NextResponse.json({ token: prev.token, loginUrl: buildLoginUrl(prev.token) });
    }
    // Pre-existing row from before tokens existed — attach one now.
    const token = generateToken();
    await adminDb.transact(adminDb.tx.spins[prev.id].update({ token }));
    return NextResponse.json({ token, loginUrl: buildLoginUrl(token) });
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
      return NextResponse.json({ token: prev.token, loginUrl: buildLoginUrl(prev.token) });
    }
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ token, loginUrl: buildLoginUrl(token) });
}
