import { NextRequest, NextResponse } from "next/server";
import { getCompanyBySlug, getPublicWheelConfig } from "@/lib/companies";
import { normalizeFomoConfig, DEFAULT_FOMO_CONFIG } from "@/lib/fomo";
import { buildFomoFeed } from "@/lib/fomoFeed";
import { getOfferConfigs } from "@/lib/offerConfig";

// Public FOMO feed for one offer. Read cross-origin by the /embed.js loader
// running on a merchant's own site, so it answers CORS preflights and sends
// an open Access-Control-Allow-Origin — everything here is already public.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const EMPTY_FEED = {
  ...DEFAULT_FOMO_CONFIG,
  enabled: false,
  items: [],
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const offerId = req.nextUrl.searchParams.get("o") ?? undefined;

  const company = await getCompanyBySlug(slug);
  if (!company || !company.isActive) {
    return NextResponse.json(EMPTY_FEED, { headers: CORS_HEADERS });
  }

  // Resolving through getPublicWheelConfig keeps the "no offer id means the
  // newest active offer" rule identical to the landing page.
  const config = await getPublicWheelConfig(company.id, offerId);
  if (!config?.offerId) {
    return NextResponse.json(EMPTY_FEED, { headers: CORS_HEADERS });
  }

  const { fomo } = await getOfferConfigs(config.offerId);
  const feed = await buildFomoFeed({
    config: normalizeFomoConfig(fomo),
    companyId: company.id,
    offerId: config.offerId,
    seed: config.offerId,
  });

  return NextResponse.json(feed, {
    headers: {
      ...CORS_HEADERS,
      // Short cache: the feed is social proof, not live data, and this keeps
      // a busy merchant page from hammering the DB on every visitor.
      "Cache-Control": "public, max-age=30, s-maxage=30",
    },
  });
}
