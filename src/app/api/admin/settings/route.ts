import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isValidAdminSessionToken } from "@/lib/adminAuth";
import { getSettings, updateSettings } from "@/lib/settingsStore";

function checkAuth(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  return isValidAdminSessionToken(token);
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await getSettings());
}

export async function PUT(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const patch: { askName?: boolean; askPhone?: boolean } = {};
  if (typeof body?.askName === "boolean") patch.askName = body.askName;
  if (typeof body?.askPhone === "boolean") patch.askPhone = body.askPhone;

  const settings = await updateSettings(patch);
  return NextResponse.json(settings);
}
