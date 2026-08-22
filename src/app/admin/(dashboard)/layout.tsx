import type { ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { AdminSessionProvider } from "@/components/admin/admin-session-provider";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AdminSessionProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </AdminSessionProvider>
  );
}
