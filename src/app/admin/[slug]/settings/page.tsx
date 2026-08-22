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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@/components/ui/field";
import { useCompany, useCompanyCrumbs } from "../company-context";

export default function CompanySettingsPage() {
  const { company, reload } = useCompany();
  const crumbs = useCompanyCrumbs("Settings");
  const [name, setName] = useState(company.name);
  const [savingName, setSavingName] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);
  const [removingPassword, setRemovingPassword] = useState(false);

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

  async function handleSetPassword(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match.");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch(`/api/admin/companies/${company.id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setPasswordError(data?.message ?? "Couldn't save the password.");
        return;
      }
      setNewPassword("");
      setConfirmPassword("");
      await reload();
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleRemovePassword() {
    setRemovingPassword(true);
    try {
      await fetch(`/api/admin/companies/${company.id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "" }),
      });
      await reload();
    } finally {
      setRemovingPassword(false);
    }
  }

  return (
    <>
      <SiteHeader crumbs={crumbs} />
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

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Company login</CardTitle>
              <Badge variant={company.hasPassword ? "default" : "outline"}>
                {company.hasPassword ? "Enabled" : "Not set"}
              </Badge>
            </div>
            <CardDescription>
              Set a password so this company can sign in directly at{" "}
              <span className="font-mono">/admin/{company.slug}</span> without the platform admin password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetPassword} className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-company-password">
                  {company.hasPassword ? "New password" : "Set password"}
                </Label>
                <Input
                  id="new-company-password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-company-password">Confirm password</Label>
                <Input
                  id="confirm-company-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {passwordError && (
                <Alert variant="destructive" className="sm:col-span-2">
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={savingPassword || !newPassword}>
                  {savingPassword ? "Saving…" : company.hasPassword ? "Change password" : "Set password"}
                </Button>
                {company.hasPassword && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRemovePassword}
                    disabled={removingPassword}
                  >
                    {removingPassword ? "Removing…" : "Disable login"}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
