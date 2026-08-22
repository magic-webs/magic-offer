"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2 } from "lucide-react";
import { SiteHeader } from "@/components/admin/site-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCompany, useCompanyCrumbs } from "../company-context";
import type { PrizeRow } from "../company-context";

function ImageUploadCard({
  title,
  description,
  imageUrl,
  shape = "square",
  uploading,
  onUpload,
}: {
  title: string;
  description: string;
  imageUrl: string | null;
  shape?: "square" | "circle";
  uploading: boolean;
  onUpload: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = "";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className={`h-24 w-24 border object-contain ${shape === "circle" ? "rounded-full" : "rounded-xl object-cover"}`}
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-dashed text-xs text-muted-foreground">
            No image
          </div>
        )}
        <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading}>
          <ImagePlus /> {uploading ? "Uploading…" : "Upload image"}
        </Button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      </CardContent>
    </Card>
  );
}

export default function WheelPage() {
  const { company, reload } = useCompany();
  const crumbs = useCompanyCrumbs("Wheel & Prizes");
  const [prizes, setPrizes] = useState<PrizeRow[]>(company.prizes);
  const [savingPrizes, setSavingPrizes] = useState(false);
  const [prizesError, setPrizesError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"wheel" | "bg" | "pin" | null>(null);

  useEffect(() => {
    setPrizes(company.prizes);
  }, [company]);

  async function uploadImage(kind: "wheel" | "bg" | "pin", file: File) {
    const endpoint =
      kind === "wheel" ? "wheel-image" : kind === "bg" ? "bg-image" : "pin-image";
    setUploading(kind);
    try {
      const form = new FormData();
      form.append("file", file);
      await fetch(`/api/admin/companies/${company.id}/${endpoint}`, { method: "POST", body: form });
      await reload();
    } finally {
      setUploading(null);
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
      await reload();
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
    await reload();
    e.target.value = "";
  }

  const hintOrder = prizes
    .filter((p) => p.label.trim())
    .map((p, i) => `${i + 1}. ${p.label.trim()}`)
    .join(", ");

  return (
    <>
      <SiteHeader crumbs={crumbs} />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <ImageUploadCard
          title="Wheel image"
          description={`Upload one image already divided into ${prizes.length} equal clockwise segments, starting at the top${hintOrder ? `: ${hintOrder}` : "."}`}
          imageUrl={company.wheelImageUrl}
          shape="circle"
          uploading={uploading === "wheel"}
          onUpload={(file) => uploadImage("wheel", file)}
        />
        <ImageUploadCard
          title="Background image"
          description="Shown behind the whole wheel page. Optional — falls back to the default gradient."
          imageUrl={company.bgImageUrl}
          uploading={uploading === "bg"}
          onUpload={(file) => uploadImage("bg", file)}
        />
        <ImageUploadCard
          title="Tip pin image"
          description="Replaces the default pointer above the wheel. Optional — falls back to the default pin shape."
          imageUrl={company.pinImageUrl}
          uploading={uploading === "pin"}
          onUpload={(file) => uploadImage("pin", file)}
        />

        <Card>
          <CardHeader>
            <CardTitle>Prizes</CardTitle>
            <CardDescription>The segments customers can win, in wheel order.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {prizes.map((p, i) => (
              <div
                key={p.id ?? `new-${i}`}
                className="flex flex-wrap items-center gap-3 rounded-xl border p-3"
              >
                {p.iconUrl ? (
                  <img src={p.iconUrl} alt="" className="h-9 w-9 rounded-lg object-contain" />
                ) : (
                  <div className="h-9 w-9 shrink-0 rounded-lg border border-dashed" />
                )}
                <Input
                  placeholder="Label"
                  value={p.label}
                  onChange={(e) => updatePrize(i, { label: e.target.value })}
                  className="min-w-36 flex-1"
                />
                <Input
                  type="number"
                  min={0}
                  placeholder="Weight"
                  value={p.weight}
                  onChange={(e) => updatePrize(i, { weight: Number(e.target.value) })}
                  className="w-24"
                />
                <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Switch
                    checked={p.isWin}
                    onCheckedChange={(checked) => updatePrize(i, { isWin: checked })}
                  />
                  Counts as a win
                </Label>
                {p.id && (
                  <Label className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                    Icon
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleIconChange(p.id, e)}
                    />
                  </Label>
                )}
                <div className="ml-auto flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => movePrize(i, -1)}
                    disabled={i === 0}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => movePrize(i, 1)}
                    disabled={i === prizes.length - 1}
                  >
                    <ArrowDown />
                  </Button>
                  <Button variant="destructive" size="icon-sm" onClick={() => removePrize(i)}>
                    <Trash2 />
                  </Button>
                </div>
              </div>
            ))}
            {prizes.length === 0 && (
              <p className="text-sm text-muted-foreground">No prizes yet — add one below.</p>
            )}
            <Button variant="outline" size="sm" onClick={addPrize}>
              <Plus /> Add prize
            </Button>
            {prizesError && (
              <Alert variant="destructive">
                <AlertDescription>{prizesError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={savePrizes} disabled={savingPrizes}>
              {savingPrizes ? "Saving…" : "Save prizes"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
