import { init, id } from "@instantdb/admin";
import schema from "../src/instant.schema";

const adminDb = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
  adminToken: process.env.INSTANT_APP_ADMIN_TOKEN!,
  schema,
});

async function main() {
  console.log("Starting Offers migration...");

  const { companies } = await adminDb.query({
    companies: {
      prizes: {},
      formFields: {},
      spins: {},
      wheelImage: {},
      bgImage: {},
      pinImage: {},
      offers: {},
    },
  });

  console.log(`Found ${companies.length} companies.`);

  for (const company of companies) {
    if (company.offers && company.offers.length > 0) {
      console.log(`Company "${company.name}" (${company.id}) already has ${company.offers.length} offers. Skipping.`);
      continue;
    }

    console.log(`Migrating company "${company.name}" (${company.id})...`);

    const offerId = id();
    const isScratch = (company as any).gameType === "scratch";
    const title = isScratch ? "Default Scratch Card" : "Default Spin Wheel";
    const type = isScratch ? "scratch" : "wheel";

    const txs: any[] = [];

    txs.push(
      adminDb.tx.offers[offerId].update({
        title,
        type,
        event: "none",
        isActive: company.isActive,
        askName: company.askName,
        askPhone: company.askPhone,
        createdAt: Date.now(),
        companyId: company.id,
      })
    );

    txs.push(adminDb.tx.offers[offerId].link({ company: company.id }));

    if (company.wheelImage) {
      txs.push(adminDb.tx.offers[offerId].link({ wheelImage: company.wheelImage.id }));
    }
    if (company.bgImage) {
      txs.push(adminDb.tx.offers[offerId].link({ bgImage: company.bgImage.id }));
    }
    if (company.pinImage) {
      txs.push(adminDb.tx.offers[offerId].link({ pinImage: company.pinImage.id }));
    }

    const prizes = company.prizes ?? [];
    console.log(`Linking ${prizes.length} prizes to offer...`);
    prizes.forEach((p) => {
      txs.push(
        adminDb.tx.prizes[p.id]
          .update({ offerId })
          .link({ offer: offerId })
      );
    });

    const fields = company.formFields ?? [];
    console.log(`Linking ${fields.length} form fields to offer...`);
    fields.forEach((f) => {
      txs.push(
        adminDb.tx.formFields[f.id]
          .update({ offerId })
          .link({ offer: offerId })
      );
    });

    const spins = company.spins ?? [];
    console.log(`Linking ${spins.length} spins to offer...`);
    spins.forEach((s) => {
      txs.push(
        adminDb.tx.spins[s.id]
          .update({ offerId })
          .link({ offer: offerId })
      );
    });

    if (txs.length > 0) {
      await adminDb.transact(txs);
      console.log(`Successfully migrated company "${company.name}". Created offer "${title}" (${offerId}).`);
    }
  }

  console.log("Migration complete.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
