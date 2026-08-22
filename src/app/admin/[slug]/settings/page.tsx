"use client";

import { useState, type FormEvent } from "react";
import { Copy, Wand2 } from "lucide-react";
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

// Excludes visually-ambiguous characters (I, l, O, 0, 1) so a generated
// password stays easy to read back and retype correctly.
const PASSWORD_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";

function generateStrongPassword(length = 16) {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (n) => PASSWORD_CHARSET[n % PASSWORD_CHARSET.length]).join("");
}

export default function CompanySettingsPage() {
  const { company, reload, viewerRole } = useCompany();
  const crumbs = useCompanyCrumbs("Settings");
  const [name, setName] = useState(company.name);
  const [savingName, setSavingName] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);
  const [removingPassword, setRemovingPassword] = useState(false);

  function handleGeneratePassword() {
    const generated = generateStrongPassword();
    setNewPassword(generated);
    setConfirmPassword(generated);
    setGeneratedPassword(generated);
    setPasswordError(null);
  }

  function copyGeneratedPassword() {
    if (!generatedPassword) return;
    navigator.clipboard.writeText(generatedPassword).then(() => {
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 1500);
    });
  }

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
      setGeneratedPassword(null);
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="new-company-password">
                    {company.hasPassword ? "New password" : "Set password"}
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className="h-auto p-0 text-muted-foreground hover:text-foreground"
                    onClick={handleGeneratePassword}
                  >
                    <Wand2 /> Generate
                  </Button>
                </div>
                <Input
                  id="new-company-password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setGeneratedPassword(null);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-company-password">Confirm password</Label>
                <Input
                  id="confirm-company-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setGeneratedPassword(null);
                  }}
                />
              </div>
              {generatedPassword && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2 sm:col-span-2">
                  <span className="flex-1 font-mono text-sm">{generatedPassword}</span>
                  <Button type="button" variant="outline" size="xs" onClick={copyGeneratedPassword}>
                    <Copy /> {copiedPassword ? "Copied!" : "Copy"}
                  </Button>
                  <p className="w-full text-xs text-muted-foreground">
                    Copy this now and share it with the company — it won&apos;t be shown again after you save.
                  </p>
                </div>
              )}
              {passwordError && (
                <Alert variant="destructive" className="sm:col-span-2">
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={savingPassword || !newPassword}>
                  {savingPassword ? "Saving…" : company.hasPassword ? "Change password" : "Set password"}
                </Button>
                {company.hasPassword && viewerRole === "admin" && (
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
