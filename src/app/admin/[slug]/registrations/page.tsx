"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { SiteHeader } from "@/components/admin/site-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { useCompany, useCompanyCrumbs } from "../company-context";

type SpinRow = {
  id: string;
  name: string;
  phone: string;
  prizeLabel: string | null;
  extraFields: Record<string, string>;
  createdAt: number;
};

export default function RegistrationsPage() {
  const { company } = useCompany();
  const crumbs = useCompanyCrumbs("Registrations");
  const [spins, setSpins] = useState<SpinRow[] | null>(null);

  useEffect(() => {
    fetch(`/api/admin/companies/${company.id}/spins`)
      .then((res) => res.json())
      .then((data) => setSpins(data.spins ?? []));
  }, [company.id]);

  const spunCount = spins?.filter((s) => s.prizeLabel).length ?? 0;

  return (
    <>
      <SiteHeader crumbs={crumbs} />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Registrations</CardTitle>
            <CardDescription>
              {spins ? `${spunCount} spun / ${spins.length} registered` : "Loading…"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {spins === null ? (
              <div className="flex items-center justify-center py-10">
                <Spinner className="size-6 text-muted-foreground" />
              </div>
            ) : spins.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Users />
                  </EmptyMedia>
                  <EmptyTitle>No registrations yet</EmptyTitle>
                  <EmptyDescription>
                    Registrations will show up here once customers start spinning.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    {company.fields.map((f) => (
                      <TableHead key={f.key}>{f.label}</TableHead>
                    ))}
                    <TableHead>Prize</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {spins.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.phone.startsWith("anon-") ? "—" : s.phone}
                      </TableCell>
                      {company.fields.map((f) => (
                        <TableCell key={f.key} className="text-muted-foreground">
                          {s.extraFields?.[f.key] || "—"}
                        </TableCell>
                      ))}
                      <TableCell>
                        {s.prizeLabel ? (
                          <Badge>{s.prizeLabel}</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not spun yet</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(s.createdAt).toLocaleString()}
                      </TableCell>
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
