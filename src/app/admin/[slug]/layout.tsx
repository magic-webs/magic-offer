"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { CompanySidebar } from "@/components/admin/company-sidebar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CompanyContext, type CompanyDetails } from "./company-context";

type Status = "loading" | "unauthenticated" | "not_found" | "ready";

export default function CompanyAdminLayout({ children }: { children: ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  const [status, setStatus] = useState<Status>("loading");
  const [company, setCompany] = useState<CompanyDetails | null>(null);

  const load = useCallback(async () => {
    const lookup = await fetch(`/api/admin/companies?slug=${encodeURIComponent(slug)}`);
    if (lookup.status === 401) {
      setStatus("unauthenticated");
      return;
    }
    if (lookup.status === 404) {
      setStatus("not_found");
      return;
    }
    const { company: found } = await lookup.json();

    const detailsRes = await fetch(`/api/admin/companies/${found.id}`);
    if (detailsRes.status === 401) {
      setStatus("unauthenticated");
      return;
    }
    const details: CompanyDetails = await detailsRes.json();
    setCompany(details);
    setStatus("ready");
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  if (status === "loading") {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  if (status === "unauthenticated" || status === "not_found" || !company) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-muted-foreground">
          {status === "not_found" ? "Company not found." : "Your session has expired."}
        </p>
        <Button size="sm" nativeButton={false} render={<Link href="/admin/companies" />}>
          Back to companies
        </Button>
      </div>
    );
  }

  return (
    <CompanyContext.Provider value={{ company, reload: load }}>
      <SidebarProvider>
        <CompanySidebar company={company} />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </CompanyContext.Provider>
  );
}
