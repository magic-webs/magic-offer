import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settingsStore";

// Public on purpose: the registration popup needs to know which fields to
// render before anyone has identified themselves. Nothing sensitive lives
// in these two booleans. Writing them requires /api/admin/settings instead.
export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}
