"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type PrizeRow = {
  id?: string;
  label: string;
  weight: number;
  isWin: boolean;
  color?: string | null;
  iconUrl?: string | null;
};

type FieldRow = {
  id?: string;
  label: string;
  required: boolean;
};

type CompanyDetails = {
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

type SpinRow = {
  id: string;
  name: string;
  phone: string;
  prizeLabel: string | null;
  extraFields: Record<string, string>;
  createdAt: number;
};

type Status = "checking" | "unauthenticated" | "not_found" | "ready";

export default function CompanyAdminPage() {
  const { slug } = useParams<{ slug: string }>();
  const [status, setStatus] = useState<Status>("checking");
  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [prizes, setPrizes] = useState<PrizeRow[]>([]);
  const [fields, setFields] = useState<FieldRow[]>([]);
  const [spins, setSpins] = useState<SpinRow[]>([]);

  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPrizes, setSavingPrizes] = useState(false);
  const [prizesError, setPrizesError] = useState<string | null>(null);
  const [savingFields, setSavingFields] = useState(false);
  const [fieldsError, setFieldsError] = useState<string | null>(null);
  const [uploadingWheelImage, setUploadingWheelImage] = useState(false);
  const [uploadingBgImage, setUploadingBgImage] = useState(false);
  const [uploadingPinImage, setUploadingPinImage] = useState(false);
  const [copied, setCopied] = useState(false);

  async function load() {
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

    const [detailsRes, spinsRes] = await Promise.all([
      fetch(`/api/admin/companies/${found.id}`),
      fetch(`/api/admin/companies/${found.id}/spins`),
    ]);
    const details: CompanyDetails = await detailsRes.json();
    const spinsData = await spinsRes.json();

    setCompany(details);
    setPrizes(details.prizes);
    setFields(details.fields);
    setSpins(spinsData.spins ?? []);
    setStatus("ready");
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function saveSettings(patch: Partial<Pick<CompanyDetails, "askName" | "askPhone" | "isActive">>) {
    if (!company) return;
    const next = { ...company, ...patch };
    setCompany(next);
    setSavingSettings(true);
    try {
      await fetch(`/api/admin/companies/${company.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleWheelImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !company) return;
    setUploadingWheelImage(true);
    try {
      const form = new FormData();
      form.append("file", file);
      await fetch(`/api/admin/companies/${company.id}/wheel-image`, { method: "POST", body: form });
      await load();
    } finally {
      setUploadingWheelImage(false);
      e.target.value = "";
    }
  }

  async function handleBgImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !company) return;
    setUploadingBgImage(true);
    try {
      const form = new FormData();
      form.append("file", file);
      await fetch(`/api/admin/companies/${company.id}/bg-image`, { method: "POST", body: form });
      await load();
    } finally {
      setUploadingBgImage(false);
      e.target.value = "";
    }
  }

  async function handlePinImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !company) return;
    setUploadingPinImage(true);
    try {
      const form = new FormData();
      form.append("file", file);
      await fetch(`/api/admin/companies/${company.id}/pin-image`, { method: "POST", body: form });
      await load();
    } finally {
      setUploadingPinImage(false);
      e.target.value = "";
    }
  }

  function updateField(index: number, patch: Partial<FieldRow>) {
    setFields((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function moveField(index: number, delta: number) {
    setFields((rows) => {
      const target = index + delta;
      if (target < 0 || target >= rows.length) return rows;
      const next = [...rows];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removeField(index: number) {
    setFields((rows) => rows.filter((_, i) => i !== index));
  }

  function addField() {
    setFields((rows) => [...rows, { label: "", required: false }]);
  }

  async function saveFields() {
    if (!company) return;
    setFieldsError(null);
    if (fields.some((f) => !f.label.trim())) {
      setFieldsError("Every field needs a label.");
      return;
    }
    setSavingFields(true);
    try {
      const res = await fetch(`/api/admin/companies/${company.id}/fields`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setFieldsError(data?.message ?? "Couldn't save fields.");
        return;
      }
      await load();
    } finally {
      setSavingFields(false);
    }
  }

  function updatePrize(index: number, patch: Partial<PrizeRow>) {
    setPrizes((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function movePrize(index: number, delta: number) {
    setPrizes((rows) => {
      const target = index + delta;
      if (target < 0 || target >= rows.length) return rows;
      const next = [...rows];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removePrize(index: number) {
    setPrizes((rows) => rows.filter((_, i) => i !== index));
  }

  function addPrize() {
    setPrizes((rows) => [...rows, { label: "", weight: 10, isWin: true }]);
  }

  async function savePrizes() {
    if (!company) return;
    setPrizesError(null);
    if (prizes.length === 0 || prizes.some((p) => !p.label.trim())) {
      setPrizesError("Every prize needs a label, and there must be at least one prize.");
      return;
    }
    setSavingPrizes(true);
    try {
      const res = await fetch(`/api/admin/companies/${company.id}/prizes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prizes }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setPrizesError(data?.message ?? "Couldn't save prizes.");
        return;
      }
      await load();
    } finally {
      setSavingPrizes(false);
    }
  }

  async function handleIconChange(prizeId: string | undefined, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !prizeId) return;
    const form = new FormData();
    form.append("file", file);
    await fetch(`/api/admin/prizes/${prizeId}/icon`, { method: "POST", body: form });
    await load();
    e.target.value = "";
  }

  const publicUrl = useMemo(() => {
    if (typeof window === "undefined" || !company) return "";
    return `${window.location.origin}/w/${company.slug}`;
  }, [company]);

  function copyLink() {
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
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
        <div className="w-full max-w-sm space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
          <p className="text-sm text-gray-300">Please log in first.</p>
          <Link href="/admin" className="inline-block rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-neutral-900 hover:bg-amber-300">
            Go to admin login
          </Link>
        </div>
      </div>
    );
  }

  if (status === "not_found" || !company) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
        <div className="w-full max-w-sm space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
          <p className="text-sm text-gray-300">Company not found.</p>
          <Link href="/admin" className="inline-block rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-neutral-900 hover:bg-amber-300">
            Back to companies
          </Link>
        </div>
      </div>
    );
  }

  const spunCount = spins.filter((s) => s.prizeLabel).length;
  const hintOrder = prizes
    .filter((p) => p.label.trim())
    .map((p, i) => `${i + 1}. ${p.label.trim()}`)
    .join(", ");

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-200">
              ← Companies
            </Link>
            <h1 className="mt-1 text-2xl font-bold">{company.name}</h1>
          </div>
          <span className={company.isActive ? "text-sm text-emerald-400" : "text-sm text-gray-500"}>
            {company.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-semibold text-white">Public link</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              readOnly
              value={publicUrl}
              className="min-w-[240px] flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300"
            />
            <button
              onClick={copyLink}
              className="rounded-xl border border-white/10 px-3 py-2 text-sm text-gray-200 hover:bg-white/5"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-semibold text-white">Settings</h2>
          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-3 text-sm text-gray-200">
              <input
                type="checkbox"
                checked={company.askName}
                onChange={(e) => saveSettings({ askName: e.target.checked })}
                className="h-4 w-4 rounded accent-amber-400"
              />
              Ask for name
            </label>
            <label className="flex items-center gap-3 text-sm text-gray-200">
              <input
                type="checkbox"
                checked={company.askPhone}
                onChange={(e) => saveSettings({ askPhone: e.target.checked })}
                className="h-4 w-4 rounded accent-amber-400"
              />
              Ask for phone number
            </label>
            <label className="flex items-center gap-3 text-sm text-gray-200">
              <input
                type="checkbox"
                checked={company.isActive}
                onChange={(e) => saveSettings({ isActive: e.target.checked })}
                className="h-4 w-4 rounded accent-amber-400"
              />
              Wheel is active (visible to the public)
            </label>
          </div>
          <p className="mt-3 text-xs text-gray-500">{savingSettings ? "Saving…" : " "}</p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-semibold text-white">Wheel image</h2>
          <p className="mt-1 text-sm text-gray-400">
            Upload one image already divided into <strong>{prizes.length} equal clockwise segments</strong>,
            starting at the top{hintOrder ? `: ${hintOrder}` : "."}
          </p>
          <div className="mt-4 flex items-center gap-4">
            {company.wheelImageUrl ? (
              <img
                src={company.wheelImageUrl}
                alt="Current wheel"
                className="h-24 w-24 rounded-full border border-white/10 object-contain"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-white/20 text-xs text-gray-500">
                No image
              </div>
            )}
            <label className="cursor-pointer rounded-xl border border-white/10 px-3 py-2 text-sm text-gray-200 hover:bg-white/5">
              {uploadingWheelImage ? "Uploading…" : "Upload image"}
              <input type="file" accept="image/*" className="hidden" onChange={handleWheelImageChange} />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-semibold text-white">Background image</h2>
          <p className="mt-1 text-sm text-gray-400">Shown behind the whole wheel page. Optional — falls back to the default gradient.</p>
          <div className="mt-4 flex items-center gap-4">
            {company.bgImageUrl ? (
              <img
                src={company.bgImageUrl}
                alt="Current background"
                className="h-24 w-24 rounded-xl border border-white/10 object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-dashed border-white/20 text-xs text-gray-500">
                No image
              </div>
            )}
            <label className="cursor-pointer rounded-xl border border-white/10 px-3 py-2 text-sm text-gray-200 hover:bg-white/5">
              {uploadingBgImage ? "Uploading…" : "Upload image"}
              <input type="file" accept="image/*" className="hidden" onChange={handleBgImageChange} />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-semibold text-white">Tip pin image</h2>
          <p className="mt-1 text-sm text-gray-400">
            Replaces the default pointer above the wheel. Optional — falls back to the default pin shape.
          </p>
          <div className="mt-4 flex items-center gap-4">
            {company.pinImageUrl ? (
              <img
                src={company.pinImageUrl}
                alt="Current pin"
                className="h-24 w-24 rounded-xl border border-white/10 object-contain"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-dashed border-white/20 text-xs text-gray-500">
                No image
              </div>
            )}
            <label className="cursor-pointer rounded-xl border border-white/10 px-3 py-2 text-sm text-gray-200 hover:bg-white/5">
              {uploadingPinImage ? "Uploading…" : "Upload image"}
              <input type="file" accept="image/*" className="hidden" onChange={handlePinImageChange} />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold text-white">Prizes</h2>
            <button onClick={addPrize} className="text-sm text-amber-300 hover:text-amber-200">
              + Add prize
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {prizes.map((p, i) => (
              <div key={p.id ?? `new-${i}`} className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 p-3">
                {p.iconUrl ? (
                  <img src={p.iconUrl} alt="" className="h-9 w-9 rounded-lg object-contain" />
                ) : (
                  <div className="h-9 w-9 rounded-lg border border-dashed border-white/20" />
                )}
                <input
                  type="text"
                  placeholder="Label"
                  value={p.label}
                  onChange={(e) => updatePrize(i, { label: e.target.value })}
                  className="min-w-[140px] flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-amber-400/70"
                />
                <input
                  type="number"
                  min={0}
                  placeholder="Weight"
                  value={p.weight}
                  onChange={(e) => updatePrize(i, { weight: Number(e.target.value) })}
                  className="w-20 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-amber-400/70"
                />
                <label className="flex items-center gap-1.5 text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={p.isWin}
                    onChange={(e) => updatePrize(i, { isWin: e.target.checked })}
                    className="h-3.5 w-3.5 accent-amber-400"
                  />
                  Counts as a win
                </label>
                {p.id && (
                  <label className="cursor-pointer text-xs text-gray-400 hover:text-gray-200">
                    Icon
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleIconChange(p.id, e)}
                    />
                  </label>
                )}
                <div className="flex gap-1">
                  <button onClick={() => movePrize(i, -1)} disabled={i === 0} className="rounded px-1.5 text-gray-400 hover:text-white disabled:opacity-30">
                    ↑
                  </button>
                  <button onClick={() => movePrize(i, 1)} disabled={i === prizes.length - 1} className="rounded px-1.5 text-gray-400 hover:text-white disabled:opacity-30">
                    ↓
                  </button>
                  <button onClick={() => removePrize(i)} className="rounded px-1.5 text-red-400 hover:text-red-300">
                    ✕
                  </button>
                </div>
              </div>
            ))}
            {prizes.length === 0 && <p className="text-sm text-gray-500">No prizes yet — add one above.</p>}
          </div>
          {prizesError && <p className="mt-3 text-sm text-red-400">{prizesError}</p>}
          <button
            onClick={savePrizes}
            disabled={savingPrizes}
            className="mt-4 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-neutral-900 hover:bg-amber-300 disabled:opacity-60"
          >
            {savingPrizes ? "Saving…" : "Save prizes"}
          </button>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold text-white">Extra fields</h2>
            <button onClick={addField} className="text-sm text-amber-300 hover:text-amber-200">
              + Add field
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-400">
            Collect anything beyond name/phone — shown in the popup as plain text inputs.
          </p>
          <div className="mt-4 space-y-3">
            {fields.map((f, i) => (
              <div key={f.id ?? `new-${i}`} className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 p-3">
                <input
                  type="text"
                  placeholder="Label (e.g. Email)"
                  value={f.label}
                  onChange={(e) => updateField(i, { label: e.target.value })}
                  className="min-w-[160px] flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-amber-400/70"
                />
                <label className="flex items-center gap-1.5 text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={f.required}
                    onChange={(e) => updateField(i, { required: e.target.checked })}
                    className="h-3.5 w-3.5 accent-amber-400"
                  />
                  Required
                </label>
                <div className="flex gap-1">
                  <button onClick={() => moveField(i, -1)} disabled={i === 0} className="rounded px-1.5 text-gray-400 hover:text-white disabled:opacity-30">
                    ↑
                  </button>
                  <button onClick={() => moveField(i, 1)} disabled={i === fields.length - 1} className="rounded px-1.5 text-gray-400 hover:text-white disabled:opacity-30">
                    ↓
                  </button>
                  <button onClick={() => removeField(i)} className="rounded px-1.5 text-red-400 hover:text-red-300">
                    ✕
                  </button>
                </div>
              </div>
            ))}
            {fields.length === 0 && <p className="text-sm text-gray-500">No extra fields — name/phone only.</p>}
          </div>
          {fieldsError && <p className="mt-3 text-sm text-red-400">{fieldsError}</p>}
          <button
            onClick={saveFields}
            disabled={savingFields}
            className="mt-4 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-neutral-900 hover:bg-amber-300 disabled:opacity-60"
          >
            {savingFields ? "Saving…" : "Save fields"}
          </button>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold text-white">Registrations</h2>
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
                  {company.fields.map((f) => (
                    <th key={f.key} className="py-2 pr-4 font-medium">
                      {f.label}
                    </th>
                  ))}
                  <th className="py-2 pr-4 font-medium">Prize</th>
                  <th className="py-2 pr-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {spins.length === 0 && (
                  <tr>
                    <td colSpan={4 + company.fields.length} className="py-6 text-center text-gray-500">
                      No registrations yet.
                    </td>
                  </tr>
                )}
                {spins.map((s) => (
                  <tr key={s.id} className="border-b border-white/5">
                    <td className="py-2 pr-4 text-gray-200">{s.name}</td>
                    <td className="py-2 pr-4 text-gray-400">{s.phone.startsWith("anon-") ? "—" : s.phone}</td>
                    {company.fields.map((f) => (
                      <td key={f.key} className="py-2 pr-4 text-gray-400">
                        {s.extraFields?.[f.key] || "—"}
                      </td>
                    ))}
                    <td className="py-2 pr-4">
                      {s.prizeLabel ? (
                        <span className="text-emerald-400">{s.prizeLabel}</span>
                      ) : (
                        <span className="text-gray-500">Not spun yet</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-gray-500">{new Date(s.createdAt).toLocaleString()}</td>
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
