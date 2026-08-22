"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

type Status = "checking" | "unauthenticated" | "authenticated";

type AdminSessionContextValue = {
  logout: () => Promise<void>;
};

const AdminSessionContext = createContext<AdminSessionContextValue | null>(null);

export function useAdminSession() {
  const ctx = useContext(AdminSessionContext);
  if (!ctx) {
    throw new Error("useAdminSession must be used within an AdminSessionProvider.");
  }
  return ctx;
}

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  async function check() {
    const res = await fetch("/api/admin/companies", { cache: "no-store" });
    setStatus(res.status === 401 ? "unauthenticated" : "authenticated");
  }

  useEffect(() => {
    check();
  }, []);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    if (loggingIn) return;
    setLoginError(null);
    setLoggingIn(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setLoginError(data?.message ?? "Incorrect password.");
        return;
      }
      setPassword("");
      await check();
    } catch {
      setLoginError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoggingIn(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setStatus("unauthenticated");
  }

  if (status === "checking") {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Admin login</CardTitle>
            <CardDescription>Sign in to manage wheel offers and companies.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
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

  return <AdminSessionContext.Provider value={{ logout }}>{children}</AdminSessionContext.Provider>;
}
