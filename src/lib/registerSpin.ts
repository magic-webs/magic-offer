import { randomBytes } from "crypto";
import { id } from "@instantdb/admin";
import { adminDb } from "@/lib/companies";
import { buildLoginUrl } from "@/lib/siteUrl";

const PHONE_RE = /^[0-9+][0-9\s-]{6,14}$/;

export interface RegisterSpinInput {
  companyId: string;
  companySlug: string | null;
  name: string | null;
  phone: string | null;
  // Present when this is a returning magic-link visitor confirming/editing
  // their already-known info, rather than a brand-new registration.
  token?: string | null;
  extraFields?: Record<string, string>;
  settings: { askName: boolean; askPhone: boolean };
  fields?: { key: string; label: string; required: boolean }[];
}

export type RegisterSpinResult =
  | { ok: true; token: string; loginUrl: string }
  | { ok: false; status: number; error: string; message: string };

function generateToken() {
  return randomBytes(9).toString("base64url");
}

// Registers a person once (scoped to a single company) and hands back a
// token that acts as a magic link. Calling this repeatedly with the same
// phone number for the same company always returns the same token —
// mirrors the exact idempotent lookup-then-create-with-race-catch pattern
// this app has always used, now scoped by companyId instead of globally.
export async function registerSpin(input: RegisterSpinInput): Promise<RegisterSpinResult> {
  const { companyId, companySlug, settings, fields = [] } = input;

  let name = input.name?.trim() ?? "";
  let phone = input.phone?.trim() ?? "";

  if (settings.askName && !name) {
    return { ok: false, status: 400, error: "invalid_input", message: "Name is required." };
  }
  name = name || "Guest";

  if (settings.askPhone) {
    if (!phone) {
      return { ok: false, status: 400, error: "invalid_input", message: "Phone number is required." };
    }
    if (!PHONE_RE.test(phone)) {
      return { ok: false, status: 400, error: "invalid_input", message: "Enter a valid phone number." };
    }
  } else {
    phone = phone && PHONE_RE.test(phone) ? phone : `anon-${randomBytes(8).toString("hex")}`;
  }

  // Whether an extra field is required is enforced only by the popup form
  // (see SpinWheel's handleRegister) — the API accepts whatever was sent,
  // required or not, rather than duplicating that check here.
  const extraFields: Record<string, string> = {};
  for (const field of fields) {
    extraFields[field.key] = (input.extraFields?.[field.key] ?? "").trim();
  }

  // A returning magic-link visitor confirming/editing their info — update
  // their existing row directly by id, no phone-uniqueness lookup needed
  // since it's their own already-issued link.
  if (input.token) {
    const { spins } = await adminDb.query({
      spins: { $: { where: { token: input.token, companyId } } },
    });
    const existing = spins[0];
    if (existing?.token) {
      await adminDb.transact(adminDb.tx.spins[existing.id].update({ name, phone, extraFields }));
      return { ok: true, token: existing.token, loginUrl: buildLoginUrl(existing.token, companySlug) };
    }
    // Stale/invalid token — fall through to the normal lookup-or-create flow.
  }

  const existing = await adminDb.query({ spins: { $: { where: { phone, companyId } } } });
  if (existing.spins.length > 0) {
    const prev = existing.spins[0];
    if (prev.token) {
      return { ok: true, token: prev.token, loginUrl: buildLoginUrl(prev.token, companySlug) };
    }
    const token = generateToken();
    await adminDb.transact(adminDb.tx.spins[prev.id].update({ token }));
    return { ok: true, token, loginUrl: buildLoginUrl(token, companySlug) };
  }

  const token = generateToken();
  try {
    await adminDb.transact(
      adminDb.tx.spins[id()]
        .update({ name, phone, token, companyId, extraFields, createdAt: Date.now() })
        .link({ company: companyId }),
    );
  } catch {
    // Race on phone+companyId — someone else's request for the same
    // number landed first. Fetch their token instead of erroring.
    const afterRace = await adminDb.query({ spins: { $: { where: { phone, companyId } } } });
    const prev = afterRace.spins[0];
    if (prev?.token) {
      return { ok: true, token: prev.token, loginUrl: buildLoginUrl(prev.token, companySlug) };
    }
    return { ok: false, status: 500, error: "server_error", message: "Something went wrong. Please try again." };
  }

  return { ok: true, token, loginUrl: buildLoginUrl(token, companySlug) };
}
