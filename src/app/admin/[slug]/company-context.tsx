"use client";

import { createContext, useContext } from "react";

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
  wheelImageUrl: string | null;
  bgImageUrl: string | null;
  pinImageUrl: string | null;
  prizes: PrizeRow[];
  fields: (FieldRow & { key: string })[];
};

export type CompanyContextValue = {
  company: CompanyDetails;
  reload: () => Promise<void>;
};

export const CompanyContext = createContext<CompanyContextValue | null>(null);

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) {
    throw new Error("useCompany must be used within the company admin layout.");
  }
  return ctx;
}
