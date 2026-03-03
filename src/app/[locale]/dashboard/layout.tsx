import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <AppSidebar />
      </div>
      <SidebarInset>
        <div className="flex flex-1 flex-col pb-20 lg:pb-0">{children}</div>
      </SidebarInset>
      {/* Mobile bottom navigation */}
      <BottomNav />
    </SidebarProvider>
  );
}
