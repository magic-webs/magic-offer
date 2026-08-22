"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
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
import { useCompany } from "../company-context";
import type { FieldRow } from "../company-context";

export default function FieldsPage() {
  const { company, reload } = useCompany();
  const [fields, setFields] = useState<FieldRow[]>(company.fields);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFields(company.fields);
  }, [company]);

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
    setError(null);
    if (fields.some((f) => !f.label.trim())) {
      setError("Every field needs a label.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/companies/${company.id}/fields`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.message ?? "Couldn't save fields.");
        return;
      }
      await reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <SiteHeader
        crumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Companies", href: "/admin/companies" },
          { label: company.name, href: `/admin/${company.slug}` },
          { label: "Form Fields" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Extra fields</CardTitle>
            <CardDescription>
              Collect anything beyond name/phone — shown in the popup as plain text inputs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.map((f, i) => (
              <div
                key={f.id ?? `new-${i}`}
                className="flex flex-wrap items-center gap-3 rounded-xl border p-3"
              >
                <Input
                  placeholder="Label (e.g. Email)"
                  value={f.label}
                  onChange={(e) => updateField(i, { label: e.target.value })}
                  className="min-w-40 flex-1"
                />
                <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Switch
                    checked={f.required}
                    onCheckedChange={(checked) => updateField(i, { required: checked })}
                  />
                  Required
                </Label>
                <div className="ml-auto flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => moveField(i, -1)}
                    disabled={i === 0}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => moveField(i, 1)}
                    disabled={i === fields.length - 1}
                  >
                    <ArrowDown />
                  </Button>
                  <Button variant="destructive" size="icon-sm" onClick={() => removeField(i)}>
                    <Trash2 />
                  </Button>
                </div>
              </div>
            ))}
            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground">No extra fields — name/phone only.</p>
            )}
            <Button variant="outline" size="sm" onClick={addField}>
              <Plus /> Add field
            </Button>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={saveFields} disabled={saving}>
              {saving ? "Saving…" : "Save fields"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
