// One-time, re-runnable migration: creates the "default" company from the
// existing global `settings` row + hardcoded PRIZES array + static wheel
// image, and backfills every existing `spins` row with a companyId/prize
// link so the legacy flat API routes keep working unchanged.
//
// Run with: npm run migrate:default-company

import { readFileSync } from "fs";
import { resolve } from "path";
import { init, id } from "@instantdb/admin";
import schema from "../src/instant.schema";
import { PRIZES } from "../src/lib/prizes";

const adminDb = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
  adminToken: process.env.INSTANT_APP_ADMIN_TOKEN!,
  schema,
});

const DEFAULT_SLUG = process.env.DEFAULT_COMPANY_SLUG ?? "default";
const SETTINGS_KEY = "global";
const SPINS_PAGE_SIZE = 100;

async function ensureCompany(): Promise<string> {
  const { companies } = await adminDb.query({ companies: { $: { where: { slug: DEFAULT_SLUG } } } });
  if (companies[0]) {
    console.log(`Company "${DEFAULT_SLUG}" already exists (${companies[0].id}).`);
    return companies[0].id;
  }

  const { settings } = await adminDb.query({ settings: { $: { where: { key: SETTINGS_KEY } } } });
  const legacy = settings[0];
  const askName = legacy?.askName ?? true;
  const askPhone = legacy?.askPhone ?? true;

  const companyId = id();
  await adminDb.transact(
    adminDb.tx.companies[companyId].update({
      slug: DEFAULT_SLUG,
      name: "Default",
      isActive: true,
      askName,
      askPhone,
      createdAt: Date.now(),
    }),
  );
  console.log(`Created company "${DEFAULT_SLUG}" (${companyId}) with askName=${askName} askPhone=${askPhone}.`);
  return companyId;
}

async function ensureWheelImage(companyId: string) {
  const { companies } = await adminDb.query({
    companies: { $: { where: { id: companyId } }, wheelImage: {} },
  });
  if (companies[0]?.wheelImage) {
    console.log("Wheel image already migrated.");
    return;
  }

  const filePath = resolve(__dirname, "../public/perfume/spin-wheel-1.png");
  const buffer = readFileSync(filePath);
  const { data } = await adminDb.storage.uploadFile(`companies/${companyId}/wheel-image`, buffer, {
    contentType: "image/png",
  });
  await adminDb.transact(adminDb.tx.companies[companyId].link({ wheelImage: data.id }));
  console.log("Uploaded and linked wheel image.");
}

async function ensurePrizes(companyId: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const { companies } = await adminDb.query({
    companies: { $: { where: { id: companyId } }, prizes: {} },
  });
  const existingPrizes = companies[0]?.prizes ?? [];

  if (existingPrizes.length > 0) {
    console.log(`${existingPrizes.length} prize(s) already migrated — rebuilding old-id map by order.`);
    const sorted = [...existingPrizes].sort((a, b) => a.order - b.order);
    const missingCompanyId = sorted.filter((row) => !row.companyId);
    if (missingCompanyId.length > 0) {
      await adminDb.transact(missingCompanyId.map((row) => adminDb.tx.prizes[row.id].update({ companyId })));
      console.log(`Backfilled companyId on ${missingCompanyId.length} prize row(s).`);
    }
    sorted.forEach((row, i) => {
      const original = PRIZES[i];
      if (original) map.set(original.id, row.id);
    });
    return map;
  }

  for (let i = 0; i < PRIZES.length; i++) {
    const p = PRIZES[i];
    const prizeId = id();
    await adminDb.transact(
      adminDb.tx.prizes[prizeId]
        .update({
          label: p.label,
          weight: p.weight,
          color: p.color,
          order: i,
          isWin: p.id !== "no_win",
          companyId,
          createdAt: Date.now(),
        })
        .link({ company: companyId }),
    );

    if (p.image) {
      const filePath = resolve(__dirname, "..", "public", p.image.replace(/^\//, ""));
      const buffer = readFileSync(filePath);
      const { data } = await adminDb.storage.uploadFile(`companies/${companyId}/prizes/${prizeId}/icon`, buffer, {
        contentType: "image/png",
      });
      await adminDb.transact(adminDb.tx.prizes[prizeId].link({ icon: data.id }));
    }

    map.set(p.id, prizeId);
    console.log(`Created prize "${p.label}" (${prizeId}) <- old id "${p.id}".`);
  }

  return map;
}

async function migrateSpins(companyId: string, prizeIdMap: Map<string, string>) {
  let migrated = 0;

  while (true) {
    const { spins } = await adminDb.query({
      spins: {
        $: { where: { companyId: { $isNull: true } }, limit: SPINS_PAGE_SIZE },
      },
    });
    if (spins.length === 0) break;

    const txs = spins.map((row) => {
      const newPrizeId = row.prizeId ? prizeIdMap.get(row.prizeId) : undefined;
      return adminDb.tx.spins[row.id]
        .update({
          companyId,
          ...(newPrizeId ? { prizeId: newPrizeId } : {}),
        })
        .link({ company: companyId });
    });
    await adminDb.transact(txs);
    migrated += spins.length;
    console.log(`Migrated ${spins.length} spin row(s) (running total: ${migrated}).`);

    if (spins.length < SPINS_PAGE_SIZE) break;
  }

  console.log(`Done. Migrated ${migrated} spin row(s).`);
}

async function main() {
  const companyId = await ensureCompany();
  await ensureWheelImage(companyId);
  const prizeIdMap = await ensurePrizes(companyId);
  await migrateSpins(companyId, prizeIdMap);
  console.log("Migration complete.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
