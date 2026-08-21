import { getDefaultCompany, updateCompany } from "@/lib/companies";

export interface PopupSettings {
  askName: boolean;
  askPhone: boolean;
}

const DEFAULT_SETTINGS: PopupSettings = { askName: true, askPhone: true };

// Legacy global settings, now backed by the "default" company's own
// askName/askPhone fields instead of a separate global `settings` row.
// Exported signatures are unchanged so every existing caller (/api/settings,
// /api/admin/settings) needs no code changes.
export async function getSettings(): Promise<PopupSettings> {
  const company = await getDefaultCompany();
  if (!company) return DEFAULT_SETTINGS;
  return { askName: company.askName, askPhone: company.askPhone };
}

export async function updateSettings(patch: Partial<PopupSettings>): Promise<PopupSettings> {
  const company = await getDefaultCompany();
  if (!company) return { ...DEFAULT_SETTINGS, ...patch };

  const next = { askName: company.askName, askPhone: company.askPhone, ...patch };
  await updateCompany(company.id, { askName: next.askName, askPhone: next.askPhone });
  return next;
}
