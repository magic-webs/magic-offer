"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Copy,
  Disc3,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
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
import { Field, FieldContent, FieldLabel, FieldTitle } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { useCompany, useCompanyCrumbs } from "./company-context";

export default function CompanyOverviewPage() {
  const { company, reload } = useCompany();
  const crumbs = useCompanyCrumbs();
  const [spunCount, setSpunCount] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [savingActive, setSavingActive] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/companies/${company.id}/spins`)
      .then((res) => res.json())
      .then((data) => {
        const spins = data.spins ?? [];
        setTotalCount(spins.length);
        setSpunCount(spins.filter((s: { prizeLabel: string | null }) => s.prizeLabel).length);
      });
  }, [company.id]);

  const publicUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/w/${company.slug}`;
  }, [company.slug]);

  function copyLink() {
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  async function toggleActive(checked: boolean) {
    setSavingActive(true);
    try {
      await fetch(`/api/admin/companies/${company.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: checked }),
      });
      await reload();
    } finally {
      setSavingActive(false);
    }
  }

  return (
    <>
      <SiteHeader crumbs={crumbs} />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Public link</CardTitle>
            <CardDescription>Share this link with customers so they can spin the wheel.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              <Input readOnly value={publicUrl} className="min-w-56 flex-1" />
              <Button variant="outline" onClick={copyLink}>
                <Copy /> {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <ClipboardList className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {spunCount ?? "…"} / {totalCount ?? "…"}
                </p>
                <p className="text-sm text-muted-foreground">Spun / registered</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <FieldLabel htmlFor="wheel-active">
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>Wheel is active</FieldTitle>
                  </FieldContent>
                  <Switch
                    id="wheel-active"
                    checked={company.isActive}
                    onCheckedChange={toggleActive}
                    disabled={savingActive}
                  />
                </Field>
              </FieldLabel>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <NavCard
            href={`/admin/${company.slug}/wheel`}
            icon={Disc3}
            title="Wheel & Prizes"
            description="Upload images and manage the prize list."
          />
          <NavCard
            href={`/admin/${company.slug}/fields`}
            icon={ListChecks}
            title="Form Fields"
            description="Collect extra information at signup."
          />
          <NavCard
            href={`/admin/${company.slug}/registrations`}
            icon={ClipboardList}
            title="Registrations"
            description="See everyone who has signed up."
          />
        </div>
      </div>
    </>
  );
}

function NavCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-colors hover:bg-muted/50">
        <CardContent className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Icon className="size-4 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
