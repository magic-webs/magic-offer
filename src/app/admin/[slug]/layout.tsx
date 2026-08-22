"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { CompanySidebar } from "@/components/admin/company-sidebar";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThemeToggle } from "@/components/theme-toggle";
import { CompanyContext, type CompanyDetails, type ViewerRole } from "./company-context";

type Status = "loading" | "login" | "not_found" | "ready";

export default function CompanyAdminLayout({ children }: { children: ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  const [status, setStatus] = useState<Status>("loading");
  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [viewerRole, setViewerRole] = useState<ViewerRole | null>(null);

  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const load = useCallback(async () => {
    const lookup = await fetch(`/api/admin/companies?slug=${encodeURIComponent(slug)}`);
    if (lookup.status === 401) {
      setStatus("login");
      return;
    }
    if (lookup.status === 404) {
      setStatus("not_found");
      return;
    }
    const { company: found, viewerRole: role } = await lookup.json();

    const detailsRes = await fetch(`/api/admin/companies/${found.id}`);
    if (detailsRes.status === 401) {
      setStatus("login");
      return;
    }
    const details: CompanyDetails = await detailsRes.json();
    setCompany(details);
    setViewerRole(role);
    setStatus("ready");
    return details;
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    if (loggingIn) return;
    setLoginError(null);
    setLoggingIn(true);
    try {
      const res = await fetch("/api/company/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setLoginError(data?.message ?? "Incorrect password.");
        return;
      }
      setPassword("");
      await load();
    } catch {
      setLoginError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoggingIn(false);
    }
  }

  async function logout() {
    await fetch("/api/company/logout", { method: "POST" });
    setCompany(null);
    setViewerRole(null);
    setStatus("login");
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  if (status === "not_found") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-muted-foreground">Company not found.</p>
      </div>
    );
  }

  if (status === "login" || !company) {
    return (
      <div className="relative flex min-h-svh items-center justify-center bg-background px-4">
        <ThemeToggle className="absolute top-4 right-4" />
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Company login</CardTitle>
            <CardDescription>Sign in to manage the “{slug}” wheel.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-password">Password</Label>
                <Input
                  id="company-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
              </div>
              {loginError && (
                <Alert variant="destructive">
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" disabled={loggingIn || !password} className="w-full">
                {loggingIn ? "Checking…" : "Log in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <CompanyContext.Provider value={{ company, reload: load, viewerRole }}>
      <SidebarProvider>
        <CompanySidebar company={company} viewerRole={viewerRole} onLogout={logout} />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </CompanyContext.Provider>
  );
}
