"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  Disc3,
  ListChecks,
  LogOut,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import type { CompanyDetails, ViewerRole } from "@/app/admin/[slug]/company-context";

function navItems(slug: string) {
  const base = `/admin/${slug}`;
  return [
    { title: "Overview", url: base, icon: ClipboardList, exact: true },
    { title: "Wheel & Prizes", url: `${base}/wheel`, icon: Disc3, exact: false },
    { title: "Form Fields", url: `${base}/fields`, icon: ListChecks, exact: false },
    { title: "Registrations", url: `${base}/registrations`, icon: ClipboardList, exact: false },
    { title: "Settings", url: `${base}/settings`, icon: Settings, exact: false },
  ];
}

export function CompanySidebar({
  company,
  viewerRole,
  onLogout,
}: {
  company: CompanyDetails;
  viewerRole: ViewerRole | null;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const items = navItems(company.slug);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        {viewerRole === "admin" && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Back to companies" render={<Link href="/admin/companies" />}>
                <ArrowLeft />
                <span>Back to companies</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
        <div className="flex items-center justify-between gap-2 px-1 pt-1 group-data-[collapsible=icon]:hidden">
          <span className="truncate font-heading text-sm font-semibold">{company.name}</span>
          <Badge variant={company.isActive ? "default" : "outline"}>
            {company.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = item.exact ? pathname === item.url : pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      render={<Link href={item.url} />}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Log out" onClick={onLogout}>
              <LogOut />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
