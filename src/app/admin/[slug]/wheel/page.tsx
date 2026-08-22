"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { GripVertical, ImagePlus, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
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

type EditablePrize = PrizeRow & {
  pendingIconFile?: File;
  pendingIconPreview?: string;
};

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
  const [prizes, setPrizes] = useState<EditablePrize[]>(company.prizes);
  const [savingPrizes, setSavingPrizes] = useState(false);
  const [prizesError, setPrizesError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"wheel" | "bg" | "pin" | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const prizeImageInputRefs = useRef<Array<HTMLInputElement | null>>([]);

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

  function updatePrize(index: number, patch: Partial<EditablePrize>) {
    setPrizes((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function removePrize(index: number) {
    setPrizes((rows) => {
      const target = rows[index];
      if (target?.pendingIconPreview) URL.revokeObjectURL(target.pendingIconPreview);
      return rows.filter((_, i) => i !== index);
    });
  }

  function addPrize() {
    setPrizes((rows) => [...rows, { label: "", weight: 10, isWin: true }]);
  }

  function handleDragStart(e: DragEvent<HTMLButtonElement>, index: number) {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>, index: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setDragOverIndex(index);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>, targetIndex: number) {
    e.preventDefault();
    const sourceIndex = dragIndex ?? Number(e.dataTransfer.getData("text/plain"));
    setDragIndex(null);
    setDragOverIndex(null);
    if (Number.isNaN(sourceIndex) || sourceIndex === targetIndex) return;
    setPrizes((rows) => {
      const next = [...rows];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  }

  async function handlePrizeImageChange(index: number, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const prize = prizes[index];
    if (prize.id) {
      const form = new FormData();
      form.append("file", file);
      await fetch(`/api/admin/prizes/${prize.id}/icon`, { method: "POST", body: form });
      await reload();
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPrizes((rows) =>
      rows.map((r, i) => {
        if (i !== index) return r;
        if (r.pendingIconPreview) URL.revokeObjectURL(r.pendingIconPreview);
        return { ...r, pendingIconFile: file, pendingIconPreview: previewUrl };
      }),
    );
  }

  async function savePrizes() {
    setPrizesError(null);
    if (prizes.length === 0 || prizes.some((p) => !p.label.trim())) {
      setPrizesError("Every prize needs a label, and there must be at least one prize.");
      return;
    }
    setSavingPrizes(true);
    try {
      const payload = prizes.map(({ pendingIconFile, pendingIconPreview, ...rest }) => rest);
      const res = await fetch(`/api/admin/companies/${company.id}/prizes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prizes: payload }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setPrizesError(data?.message ?? "Couldn't save prizes.");
        return;
      }

      // New prizes have no id yet, so any image picked for them couldn't be
      // uploaded immediately — do it now, matching by array position, which
      // the API preserves exactly (order is assigned from array index on
      // both the save and the reload's sort).
      const pendingUploads = prizes
        .map((p, index) => ({ index, file: p.pendingIconFile }))
        .filter((entry): entry is { index: number; file: File } => Boolean(entry.file));

      const freshCompany = await reload();
      if (pendingUploads.length > 0 && freshCompany) {
        await Promise.all(
          pendingUploads.map(async ({ index, file }) => {
            const prizeId = freshCompany.prizes[index]?.id;
            if (!prizeId) return;
            const form = new FormData();
            form.append("file", file);
            await fetch(`/api/admin/prizes/${prizeId}/icon`, { method: "POST", body: form });
          }),
        );
        await reload();
      }
    } finally {
      setSavingPrizes(false);
    }
  }

  const hintOrder = prizes
    .filter((p) => p.label.trim())
    .map((p, i) => `${i + 1}. ${p.label.trim()}`)
    .join(", ");

  return (
    <>
      <SiteHeader crumbs={crumbs} />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Prizes</CardTitle>
            <CardDescription>
              The segments customers can win, in wheel order. Drag the handle to reorder.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {prizes.map((p, i) => {
              const previewUrl = p.pendingIconPreview ?? p.iconUrl ?? null;
              return (
                <div
                  key={p.id ?? `new-${i}`}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDragLeave={() => setDragOverIndex((cur) => (cur === i ? null : cur))}
                  onDrop={(e) => handleDrop(e, i)}
                  className={cn(
                    "flex flex-wrap items-center gap-3 rounded-xl border p-3 transition-colors",
                    dragOverIndex === i && "border-primary bg-muted/50",
                  )}
                >
                  <button
                    type="button"
                    draggable
                    onDragStart={(e) => handleDragStart(e, i)}
                    onDragEnd={() => {
                      setDragIndex(null);
                      setDragOverIndex(null);
                    }}
                    className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
                    aria-label="Drag to reorder"
                  >
                    <GripVertical />
                  </button>

                  <div className="flex flex-col items-center gap-1">
                    {previewUrl ? (
                      <img src={previewUrl} alt="" className="h-9 w-9 rounded-lg object-contain" />
                    ) : (
                      <div className="h-9 w-9 shrink-0 rounded-lg border border-dashed" />
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => prizeImageInputRefs.current[i]?.click()}
                      aria-label="Upload prize image"
                    >
                      <ImagePlus />
                    </Button>
                    <input
                      ref={(el) => {
                        prizeImageInputRefs.current[i] = el;
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePrizeImageChange(i, e)}
                    />
                  </div>

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
                  <div className="ml-auto">
                    <Button variant="destructive" size="icon-sm" onClick={() => removePrize(i)}>
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              );
            })}
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

      </div>
    </>
  );
}
