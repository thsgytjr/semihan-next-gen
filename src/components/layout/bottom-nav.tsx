"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { LayoutDashboard, Users, ClipboardCheck, History, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

const departmentSlug = "sprout";

export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const navItems = [
    {
      title: t("dashboard"),
      href: "/dashboard",
      icon: LayoutDashboard,
      match: (p: string) => p === "/dashboard",
    },
    {
      title: t("students"),
      href: `/dashboard/${departmentSlug}/students`,
      icon: Users,
      match: (p: string) => p.includes("/students"),
    },
    {
      title: t("teachers"),
      href: `/dashboard/${departmentSlug}/teachers`,
      icon: GraduationCap,
      match: (p: string) => p.includes("/teachers"),
    },
    {
      title: t("attendance"),
      href: `/dashboard/${departmentSlug}/attendance`,
      icon: ClipboardCheck,
      match: (p: string) => p.includes("/attendance") && !p.includes("/history"),
    },
    {
      title: t("attendanceHistory"),
      href: `/dashboard/${departmentSlug}/attendance/history`,
      icon: History,
      match: (p: string) => p.includes("/history"),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border lg:hidden safe-bottom">
      <div className="flex items-stretch">
        {navItems.map((item) => {
          const isActive = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2.5 px-1 transition-colors",
                isActive
                  ? "text-green-600 dark:text-green-400"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "flex items-center justify-center rounded-xl p-1.5 transition-all",
                isActive && "bg-green-100 dark:bg-green-900/30"
              )}>
                <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
              </div>
              <span className={cn(
                "text-[10px] leading-none font-medium",
                isActive ? "font-semibold" : ""
              )}>
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>
      {/* iOS safe area spacer */}
      <div className="h-safe-bottom" />
    </nav>
  );
}
