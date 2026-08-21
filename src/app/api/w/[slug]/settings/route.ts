import { NextRequest, NextResponse } from "next/server";
import { getCompanyBySlug } from "@/lib/companies";

// Company-scoped equivalent of the public /api/settings route.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) {
    return NextResponse.json({ error: "not_found", message: "Wheel not found." }, { status: 404 });
  }
  return NextResponse.json({ askName: company.askName, askPhone: company.askPhone });
}
