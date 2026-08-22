"use client";

import { useState, type FormEvent } from "react";
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
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@/components/ui/field";
import { useCompany } from "../company-context";

export default function CompanySettingsPage() {
  const { company, reload } = useCompany();
  const [name, setName] = useState(company.name);
  const [savingName, setSavingName] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);

  async function patch(body: Record<string, unknown>) {
    await fetch(`/api/admin/companies/${company.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await reload();
  }

  async function handleToggle(key: "askName" | "askPhone" | "isActive", checked: boolean) {
    setSavingToggle(true);
    try {
      await patch({ [key]: checked });
    } finally {
      setSavingToggle(false);
    }
  }

  async function handleSaveName(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || savingName) return;
    setSavingName(true);
    try {
      await patch({ name: name.trim() });
    } finally {
      setSavingName(false);
    }
  }

  return (
    <>
      <SiteHeader
        crumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Companies", href: "/admin/companies" },
          { label: company.name, href: `/admin/${company.slug}` },
          { label: "Settings" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Company details</CardTitle>
            <CardDescription>The name shown across the admin panel.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveName} className="flex flex-wrap items-end gap-3">
              <div className="min-w-56 flex-1 space-y-2">
                <Label htmlFor="company-name">Company name</Label>
                <Input id="company-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <Button type="submit" disabled={savingName || !name.trim() || name === company.name}>
                {savingName ? "Saving…" : "Save"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wheel settings</CardTitle>
            <CardDescription>Control what the signup popup asks for, and whether the wheel is public.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <FieldLabel htmlFor="ask-name">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>Ask for name</FieldTitle>
                  <FieldDescription>Show a name input in the signup popup.</FieldDescription>
                </FieldContent>
                <Switch
                  id="ask-name"
                  checked={company.askName}
                  onCheckedChange={(checked) => handleToggle("askName", checked)}
                  disabled={savingToggle}
                />
              </Field>
            </FieldLabel>
            <FieldLabel htmlFor="ask-phone">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>Ask for phone number</FieldTitle>
                  <FieldDescription>Show a phone number input in the signup popup.</FieldDescription>
                </FieldContent>
                <Switch
                  id="ask-phone"
                  checked={company.askPhone}
                  onCheckedChange={(checked) => handleToggle("askPhone", checked)}
                  disabled={savingToggle}
                />
              </Field>
            </FieldLabel>
            <FieldLabel htmlFor="wheel-active">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>Wheel is active</FieldTitle>
                  <FieldDescription>Turn off to hide the wheel from the public without deleting it.</FieldDescription>
                </FieldContent>
                <Switch
                  id="wheel-active"
                  checked={company.isActive}
                  onCheckedChange={(checked) => handleToggle("isActive", checked)}
                  disabled={savingToggle}
                />
              </Field>
            </FieldLabel>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">{savingToggle ? "Saving…" : " "}</p>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
