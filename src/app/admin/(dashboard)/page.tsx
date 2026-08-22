"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Building2, Gift, Plus, Ticket, type LucideIcon } from "lucide-react";
import { SiteHeader } from "@/components/admin/site-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
};

export default function AdminDashboardPage() {
  const [companies, setCompanies] = useState<CompanyRow[] | null>(null);

  useEffect(() => {
    fetch("/api/admin/companies")
      .then((res) => res.json())
      .then((data) => setCompanies(data.companies ?? []));
  }, []);

  const totalCompanies = companies?.length ?? 0;
  const activeCompanies = companies?.filter((c) => c.isActive).length ?? 0;
  const totalRegistrations = companies?.reduce((sum, c) => sum + c.spinCount, 0) ?? 0;
  const recent = companies?.slice(0, 5) ?? [];

  return (
    <>
      <SiteHeader
        crumbs={[{ label: "Dashboard" }]}
        actions={
          <Button size="sm" nativeButton={false} render={<Link href="/admin/companies" />}>
            <Plus /> New company
          </Button>
        }
      />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        {companies === null ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner className="size-6 text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard icon={Building2} label="Companies" value={totalCompanies} />
              <StatCard icon={Gift} label="Active wheels" value={activeCompanies} />
              <StatCard icon={Ticket} label="Total registrations" value={totalRegistrations} />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent companies</CardTitle>
                <CardDescription>The latest companies added to the platform.</CardDescription>
              </CardHeader>
              <CardContent>
                {recent.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Building2 />
                      </EmptyMedia>
                      <EmptyTitle>No companies yet</EmptyTitle>
                      <EmptyDescription>Create your first company to get started.</EmptyDescription>
                    </EmptyHeader>
                    <Button size="sm" nativeButton={false} render={<Link href="/admin/companies" />}>
                      <Plus /> New company
                    </Button>
                  </Empty>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Registrations</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recent.map((c) => (
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
                          <TableCell className="text-right">{c.spinCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-2xl font-semibold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
