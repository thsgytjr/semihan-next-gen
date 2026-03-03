"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/navigation";
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
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  History,
  LogOut,
  Sprout,
} from "lucide-react";

const departmentSlug = "sprout";

export function AppSidebar() {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { isMobile, setOpenMobile } = useSidebar();

  const navItems = [
    {
      title: t("nav.dashboard"),
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: t("nav.students"),
      href: `/dashboard/${departmentSlug}/students`,
      icon: Users,
    },
    {
      title: t("nav.attendance"),
      href: `/dashboard/${departmentSlug}/attendance`,
      icon: ClipboardCheck,
    },
    {
      title: t("nav.attendanceHistory"),
      href: `/dashboard/${departmentSlug}/attendance/history`,
      icon: History,
    },
  ];

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
            <Sprout className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{t("common.appName")}</span>
            <span className="text-xs text-muted-foreground">
              {t("departments.sprout")}
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <Separator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.dashboard")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link
                      href={item.href}
                      onClick={() => isMobile && setOpenMobile(false)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center justify-between">
          <LocaleSwitcher />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title={t("auth.logout")}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
