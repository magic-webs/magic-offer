"use client";

import { createContext, useContext } from "react";
import type { Crumb } from "@/components/admin/site-header";

export type PrizeRow = {
  id?: string;
  label: string;
  weight: number;
  isWin: boolean;
  color?: string | null;
  iconUrl?: string | null;
};

export type FieldRow = {
  id?: string;
  label: string;
  required: boolean;
};

export type CompanyDetails = {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  askName: boolean;
  askPhone: boolean;
  hasPassword: boolean;
  gameType: string;
  wheelImageUrl: string | null;
  bgImageUrl: string | null;
  pinImageUrl: string | null;
  prizes: PrizeRow[];
  fields: (FieldRow & { key: string })[];
};

export type ViewerRole = "admin" | "company";

export type CompanyContextValue = {
  company: CompanyDetails;
  reload: () => Promise<CompanyDetails | undefined>;
  viewerRole: ViewerRole | null;
};

export const CompanyContext = createContext<CompanyContextValue | null>(null);

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) {
    throw new Error("useCompany must be used within the company admin layout.");
  }
  return ctx;
}

// A company-role viewer has no access to the super-admin dashboard/companies
// list, so those leading crumbs would just dead-end at its login wall —
// omit them and start the trail at the company's own name instead.
export function useCompanyCrumbs(...trail: string[]): Crumb[] {
  const { company, viewerRole } = useCompany();
  const base: Crumb[] =
    viewerRole === "admin"
      ? [{ label: "Dashboard", href: "/admin" }, { label: "Companies", href: "/admin/companies" }]
      : [];
  const companyCrumb: Crumb =
    trail.length > 0 ? { label: company.name, href: `/admin/${company.slug}` } : { label: company.name };
  return [...base, companyCrumb, ...trail.map((label) => ({ label }))];
}
