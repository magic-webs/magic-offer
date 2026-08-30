import { NextRequest, NextResponse } from "next/server";
import { getCompanyBySlug, getPublicWheelConfig } from "@/lib/companies";
import { normalizeEmbedConfig, DEFAULT_EMBED_CONFIG } from "@/lib/embed";
import { getOfferConfigs } from "@/lib/offerConfig";
import { getSiteUrl } from "@/lib/siteUrl";

// Everything /embed.js needs in one round trip: whether the embed is turned
// on, which triggers to arm, how the modal should look, and the URL to load
// inside it. Called cross-origin from the merchant's own site.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const offerId = req.nextUrl.searchParams.get("o") ?? undefined;

  const disabled = {
    enabled: false,
    config: { ...DEFAULT_EMBED_CONFIG, enabled: false },
    offer: null,
  };

  const company = await getCompanyBySlug(slug);
  if (!company || !company.isActive) {
    return NextResponse.json(disabled, { headers: CORS_HEADERS });
  }

  const publicConfig = await getPublicWheelConfig(company.id, offerId);
  if (!publicConfig?.offerId) {
    return NextResponse.json(disabled, { headers: CORS_HEADERS });
  }

  const { embed } = await getOfferConfigs(publicConfig.offerId);
  const config = normalizeEmbedConfig(embed);
  if (!config.enabled) {
    return NextResponse.json(disabled, { headers: CORS_HEADERS });
  }

  const siteUrl = getSiteUrl();

  return NextResponse.json(
    {
      enabled: true,
      config,
      offer: {
        id: publicConfig.offerId,
        title: publicConfig.title,
        companyName: company.name,
        // `embed=1` tells the landing page it is inside an iframe: it drops
        // the outer chrome and posts a close message to the parent.
        url: `${siteUrl}/w/${slug}?o=${publicConfig.offerId}&embed=1`,
        fomoUrl: `${siteUrl}/api/w/${slug}/fomo?o=${publicConfig.offerId}`,
      },
    },
    {
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "public, max-age=60, s-maxage=60",
      },
    },
  );
}
