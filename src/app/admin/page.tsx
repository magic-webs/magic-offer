"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";

type CompanyRow = {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  spinCount: number;
};

type Status = "checking" | "unauthenticated" | "authenticated";

export default function AdminPage() {
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function loadData() {
    const res = await fetch("/api/admin/companies");
    if (res.status === 401) {
      setStatus("unauthenticated");
      return;
    }
    const data = await res.json();
    setCompanies(data.companies ?? []);
    setStatus("authenticated");
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      await loadData();
    } catch {
      setLoginError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setCompanies([]);
    setStatus("unauthenticated");
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (creating || !newName.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.status === 401) {
        setStatus("unauthenticated");
        return;
      }
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setCreateError(data?.message ?? "Couldn't create the company.");
        return;
      }
      setNewName("");
      await loadData();
    } finally {
      setCreating(false);
    }
  }

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6"
        >
          <h1 className="text-lg font-bold text-white">Admin Login</h1>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-500 focus:border-amber-400/70 focus:ring-2 focus:ring-amber-400/20"
          />
          {loginError && <p className="text-sm text-red-400">{loginError}</p>}
          <button
            type="submit"
            disabled={loggingIn}
            className="w-full rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-neutral-900 hover:bg-amber-300 disabled:opacity-60"
          >
            {loggingIn ? "Checking…" : "Log In"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Wheel Offers Admin</h1>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5"
          >
            Log out
          </button>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-semibold text-white">Create a company</h2>
          <form onSubmit={handleCreate} className="mt-3 flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Company name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="min-w-[220px] flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-500 focus:border-amber-400/70 focus:ring-2 focus:ring-amber-400/20"
            />
            <button
              type="submit"
              disabled={creating || !newName.trim()}
              className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-neutral-900 hover:bg-amber-300 disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create"}
            </button>
          </form>
          {createError && <p className="mt-2 text-sm text-red-400">{createError}</p>}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-semibold text-white">Companies</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400">
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Slug</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Registrations</th>
                </tr>
              </thead>
              <tbody>
                {companies.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-500">
                      No companies yet — create one above.
                    </td>
                  </tr>
                )}
                {companies.map((c) => (
                  <tr key={c.id} className="border-b border-white/5">
                    <td className="py-2 pr-4 text-gray-200">
                      <Link href={`/admin/${c.slug}`} className="hover:text-amber-300">
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 font-mono text-gray-400">{c.slug}</td>
                    <td className="py-2 pr-4">
                      <span className={c.isActive ? "text-emerald-400" : "text-gray-500"}>
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-gray-400">{c.spinCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
