"use client";

import { useEffect, useState, type FormEvent } from "react";

type SpinRow = {
  id: string;
  name: string;
  phone: string;
  prizeId: string | null;
  prizeLabel: string | null;
  createdAt: number;
};

type Settings = {
  askName: boolean;
  askPhone: boolean;
};

type Status = "checking" | "unauthenticated" | "authenticated";

export default function AdminPage() {
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [spins, setSpins] = useState<SpinRow[]>([]);
  const [settings, setSettings] = useState<Settings>({ askName: true, askPhone: true });
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  async function loadData() {
    const [spinsRes, settingsRes] = await Promise.all([
      fetch("/api/admin/spins"),
      fetch("/api/admin/settings"),
    ]);
    if (spinsRes.status === 401 || settingsRes.status === 401) {
      setStatus("unauthenticated");
      return;
    }
    const spinsData = await spinsRes.json();
    const settingsData = await settingsRes.json();
    setSpins(spinsData.spins ?? []);
    setSettings(settingsData);
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
    setSpins([]);
    setStatus("unauthenticated");
  }

  async function saveSettings(next: Settings) {
    setSettings(next);
    setSavingSettings(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (res.status === 401) {
        setStatus("unauthenticated");
        return;
      }
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } finally {
      setSavingSettings(false);
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

  const spunCount = spins.filter((s) => s.prizeId).length;

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Spin Wheel Admin</h1>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5"
          >
            Log out
          </button>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-semibold text-white">Popup fields</h2>
          <p className="mt-1 text-sm text-gray-400">
            Choose what the registration popup asks visitors for before they can spin.
          </p>
          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-3 text-sm text-gray-200">
              <input
                type="checkbox"
                checked={settings.askName}
                onChange={(e) => saveSettings({ ...settings, askName: e.target.checked })}
                className="h-4 w-4 rounded accent-amber-400"
              />
              Ask for name
            </label>
            <label className="flex items-center gap-3 text-sm text-gray-200">
              <input
                type="checkbox"
                checked={settings.askPhone}
                onChange={(e) => saveSettings({ ...settings, askPhone: e.target.checked })}
                className="h-4 w-4 rounded accent-amber-400"
              />
              Ask for phone number
            </label>
          </div>
          {!settings.askPhone && (
            <p className="mt-3 text-xs text-amber-300">
              Heads up: without a phone number there's no way to identify a returning visitor, so
              duplicate-spin prevention is effectively off while this is unchecked.
            </p>
          )}
          <p className="mt-3 text-xs text-gray-500">
            {savingSettings ? "Saving…" : savedFlash ? "Saved." : " "}
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold text-white">Results</h2>
            <p className="text-sm text-gray-400">
              {spunCount} spun / {spins.length} registered
            </p>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400">
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Phone</th>
                  <th className="py-2 pr-4 font-medium">Prize</th>
                  <th className="py-2 pr-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {spins.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-500">
                      No registrations yet.
                    </td>
                  </tr>
                )}
                {spins.map((s) => (
                  <tr key={s.id} className="border-b border-white/5">
                    <td className="py-2 pr-4 text-gray-200">{s.name}</td>
                    <td className="py-2 pr-4 text-gray-400">
                      {s.phone.startsWith("anon-") ? "—" : s.phone}
                    </td>
                    <td className="py-2 pr-4">
                      {s.prizeLabel ? (
                        <span
                          className={
                            s.prizeId === "no_win" ? "text-gray-400" : "text-emerald-400"
                          }
                        >
                          {s.prizeLabel}
                        </span>
                      ) : (
                        <span className="text-gray-500">Not spun yet</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-gray-500">
                      {new Date(s.createdAt).toLocaleString()}
                    </td>
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
