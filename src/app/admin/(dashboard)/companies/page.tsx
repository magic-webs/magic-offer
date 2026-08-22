"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Building2, Plus } from "lucide-react";
import { SiteHeader } from "@/components/admin/site-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type CompanyRow = {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  spinCount: number;
  hasPassword: boolean;
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyRow[] | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function loadData() {
    const res = await fetch("/api/admin/companies");
    const data = await res.json();
    setCompanies(data.companies ?? []);
  }

  useEffect(() => {
    loadData();
  }, []);

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

  return (
    <>
      <SiteHeader crumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Companies" }]} />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Create a company</CardTitle>
            <CardDescription>Each company gets its own wheel, prizes, and public link.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
              <div className="min-w-56 flex-1 space-y-2">
                <Label htmlFor="new-company-name">Company name</Label>
                <Input
                  id="new-company-name"
                  placeholder="e.g. Test Salon"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={creating || !newName.trim()}>
                <Plus /> {creating ? "Creating…" : "Create"}
              </Button>
            </form>
            {createError && (
              <Alert variant="destructive" className="mt-3">
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Companies</CardTitle>
            <CardDescription>All companies registered on the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            {companies === null ? (
              <div className="flex items-center justify-center py-10">
                <Spinner className="size-6 text-muted-foreground" />
              </div>
            ) : companies.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Building2 />
                  </EmptyMedia>
                  <EmptyTitle>No companies yet</EmptyTitle>
                  <EmptyDescription>Create one above to get started.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Login</TableHead>
                    <TableHead className="text-right">Registrations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        <Link href={`/admin/${c.slug}`} className="hover:underline">
                          {c.name}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">{c.slug}</TableCell>
                      <TableCell>
                        <Badge variant={c.isActive ? "default" : "outline"}>
                          {c.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.hasPassword ? "secondary" : "outline"}>
                          {c.hasPassword ? "Enabled" : "Not set"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{c.spinCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
