import { NextRequest, NextResponse } from "next/server";
import { id as generateId } from "@instantdb/admin";
import { adminDb, resolveCompanyAccess } from "@/lib/companies";
import {
  generateWebhookSecret,
  isValidWebhookUrl,
  isWebhookEventId,
  listWebhooks,
  WEBHOOK_EVENTS,
  type WebhookEventId,
} from "@/lib/webhooks";

interface WebhookInput {
  id?: string;
  url: string;
  events: string[];
  isActive: boolean;
  // Set by the "Regenerate" button — swaps in a fresh signing secret,
  // immediately invalidating signatures the receiver was verifying with.
  regenerateSecret?: boolean;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: companyId } = await params;
  if (!(await resolveCompanyAccess(req, companyId))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    webhooks: await listWebhooks(companyId),
    availableEvents: WEBHOOK_EVENTS,
  });
}

// Saves the whole endpoint list atomically, mirroring the prizes/fields
// PUT routes: rows matched by id are updated (keeping their existing
// secret unless regeneration was asked for), rows without an id are
// created with a fresh secret, and any row not present in the submitted
// array is deleted.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: companyId } = await params;
  if (!(await resolveCompanyAccess(req, companyId))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const input: WebhookInput[] = Array.isArray(body?.webhooks) ? body.webhooks : [];

  const cleaned = input.map((w) => ({
    id: typeof w.id === "string" ? w.id : undefined,
    url: typeof w.url === "string" ? w.url.trim() : "",
    events: (Array.isArray(w.events) ? w.events : []).filter(isWebhookEventId) as WebhookEventId[],
    isActive: Boolean(w.isActive),
    regenerateSecret: Boolean(w.regenerateSecret),
  }));

  for (const w of cleaned) {
    if (!isValidWebhookUrl(w.url)) {
      return NextResponse.json(
        { error: "invalid_input", message: `"${w.url || "(empty)"}" isn't a valid http(s) URL.` },
        { status: 400 },
      );
    }
    if (w.events.length === 0) {
      return NextResponse.json(
        { error: "invalid_input", message: "Every endpoint needs at least one event selected." },
        { status: 400 },
      );
    }
  }

  const existing = await listWebhooks(companyId);
  const existingById = new Map(existing.map((w) => [w.id, w]));
  const keptIds = new Set(cleaned.filter((w) => w.id).map((w) => w.id!));
  const toDelete = existing.filter((w) => !keptIds.has(w.id)).map((w) => w.id);

  const txs = [
    ...toDelete.map((webhookId) => adminDb.tx.webhooks[webhookId].delete()),
    ...cleaned.map((w) => {
      const prior = w.id ? existingById.get(w.id) : undefined;
      if (prior) {
        return adminDb.tx.webhooks[prior.id].update({
          url: w.url,
          events: w.events,
          isActive: w.isActive,
          secret: w.regenerateSecret ? generateWebhookSecret() : prior.secret,
        });
      }
      return adminDb.tx.webhooks[generateId()]
        .update({
          companyId,
          url: w.url,
          events: w.events,
          isActive: w.isActive,
          secret: generateWebhookSecret(),
          createdAt: Date.now(),
        })
        .link({ company: companyId });
    }),
  ];

  await adminDb.transact(txs);
  return NextResponse.json({ ok: true, webhooks: await listWebhooks(companyId) });
}
