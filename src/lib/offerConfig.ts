import { adminDb } from "@/lib/companies";

// Small focused read of just the two JSON config blobs on an offer, so the
// FOMO and embed endpoints do not have to pull prizes, form fields and
// three image links they never look at.
export async function getOfferConfigs(offerId: string): Promise<{
  fomo: unknown;
  embed: unknown;
  title: string | null;
  companyId: string | null;
  isActive: boolean;
}> {
  const { offers } = await adminDb.query({ offers: { $: { where: { id: offerId } } } });
  const offer = offers[0];
  if (!offer) {
    return { fomo: null, embed: null, title: null, companyId: null, isActive: false };
  }
  return {
    fomo: offer.fomoConfig ?? null,
    embed: offer.embedConfig ?? null,
    title: offer.title,
    companyId: offer.companyId ?? null,
    isActive: offer.isActive,
  };
}
