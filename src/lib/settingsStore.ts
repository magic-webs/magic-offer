import { init, id } from "@instantdb/admin";
import schema from "@/instant.schema";

const adminDb = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
  adminToken: process.env.INSTANT_APP_ADMIN_TOKEN!,
  schema,
});

const SETTINGS_KEY = "global";

export interface PopupSettings {
  askName: boolean;
  askPhone: boolean;
}

const DEFAULT_SETTINGS: PopupSettings = { askName: true, askPhone: true };

// There's exactly one settings row, found (or lazily created) by its fixed
// key. Everything here only ever runs server-side via the admin SDK.
export async function getSettings(): Promise<PopupSettings> {
  const { settings } = await adminDb.query({ settings: { $: { where: { key: SETTINGS_KEY } } } });
  const row = settings[0];
  if (!row) return DEFAULT_SETTINGS;
  return { askName: row.askName, askPhone: row.askPhone };
}

export async function updateSettings(patch: Partial<PopupSettings>): Promise<PopupSettings> {
  const { settings } = await adminDb.query({ settings: { $: { where: { key: SETTINGS_KEY } } } });
  const row = settings[0];
  const next = { ...(row ?? DEFAULT_SETTINGS), ...patch };

  await adminDb.transact(
    adminDb.tx.settings[row?.id ?? id()].update({
      key: SETTINGS_KEY,
      askName: next.askName,
      askPhone: next.askPhone,
    }),
  );

  return { askName: next.askName, askPhone: next.askPhone };
}
