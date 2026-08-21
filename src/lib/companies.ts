import { init, id } from "@instantdb/admin";
import schema from "@/instant.schema";
import type { WheelPrize } from "@/lib/wheel";

const adminDb = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
  adminToken: process.env.INSTANT_APP_ADMIN_TOKEN!,
  schema,
});

export interface Company {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  askName: boolean;
  askPhone: boolean;
  createdAt: number;
}

export interface FormField {
  id: string;
  key: string;
  label: string;
  required: boolean;
}

export interface PublicWheelConfig {
  askName: boolean;
  askPhone: boolean;
  wheelImageUrl: string | null;
  bgImageUrl: string | null;
  pinImageUrl: string | null;
  prizes: WheelPrize[];
  fields: FormField[];
}

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "company"
  );
}

// Same slug shape as company slugs — used as the stable JSON key on
// spins.extraFields for a form field, derived from its label once at
// creation and never changed afterward.
export const slugifyFieldKey = slugify;

export async function getCompanyBySlug(slug: string): Promise<Company | null> {
  const { companies } = await adminDb.query({ companies: { $: { where: { slug } } } });
  return companies[0] ?? null;
}

export async function getDefaultCompany(): Promise<Company | null> {
  const slug = process.env.DEFAULT_COMPANY_SLUG ?? "default";
  return getCompanyBySlug(slug);
}

export async function listCompaniesWithSpinCounts() {
  const { companies, spins } = await adminDb.query({
    companies: { $: { order: { createdAt: "desc" } } },
    spins: {},
  });
  const counts = new Map<string, number>();
  for (const s of spins) {
    if (!s.companyId) continue;
    counts.set(s.companyId, (counts.get(s.companyId) ?? 0) + 1);
  }
  return companies.map((c) => ({ ...c, spinCount: counts.get(c.id) ?? 0 }));
}

// Generates a unique slug from a name (e.g. "Test Salon" -> "test-salon",
// deduped to "test-salon-2" if that slug is already taken) and creates the
// company row.
export async function createCompany(name: string): Promise<Company> {
  const base = slugify(name);
  let slug = base;
  let suffix = 2;
  while (await getCompanyBySlug(slug)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  const companyId = id();
  await adminDb.transact(
    adminDb.tx.companies[companyId].update({
      slug,
      name,
      isActive: true,
      askName: true,
      askPhone: true,
      createdAt: Date.now(),
    }),
  );

  return { id: companyId, slug, name, isActive: true, askName: true, askPhone: true, createdAt: Date.now() };
}

export async function getCompanyWithDetails(companyId: string) {
  const { companies } = await adminDb.query({
    companies: {
      $: { where: { id: companyId } },
      prizes: { $: { order: { order: "asc" } }, icon: {} },
      formFields: { $: { order: { order: "asc" } } },
      wheelImage: {},
      bgImage: {},
      pinImage: {},
    },
  });
  return companies[0] ?? null;
}

export async function getFormFields(companyId: string): Promise<FormField[]> {
  const { formFields } = await adminDb.query({
    formFields: { $: { where: { companyId }, order: { order: "asc" } } },
  });
  return formFields.map((f) => ({ id: f.id, key: f.key, label: f.label, required: f.required }));
}

export async function updateCompany(
  companyId: string,
  patch: Partial<Pick<Company, "name" | "isActive" | "askName" | "askPhone">>,
) {
  await adminDb.transact(adminDb.tx.companies[companyId].update(patch));
}

export async function getPublicWheelConfig(companyId: string): Promise<PublicWheelConfig | null> {
  const company = await getCompanyWithDetails(companyId);
  if (!company) return null;

  return {
    askName: company.askName,
    askPhone: company.askPhone,
    wheelImageUrl: company.wheelImage?.url ?? null,
    bgImageUrl: company.bgImage?.url ?? null,
    pinImageUrl: company.pinImage?.url ?? null,
    prizes: (company.prizes ?? []).map((p) => ({
      id: p.id,
      label: p.label,
      weight: p.weight,
      order: p.order,
      isWin: p.isWin,
      color: p.color,
      iconUrl: p.icon?.url,
    })),
    fields: (company.formFields ?? []).map((f) => ({
      id: f.id,
      key: f.key,
      label: f.label,
      required: f.required,
    })),
  };
}

export { adminDb };
