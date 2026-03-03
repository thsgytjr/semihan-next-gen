"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

interface HeaderProps {
  title: string;
  children?: React.ReactNode;
}

export function Header({ title, children }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/95 backdrop-blur px-4 lg:px-6">
      {/* Desktop: sidebar trigger */}
      <div className="hidden lg:flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-6" />
      </div>
      <h1 className="text-base font-bold tracking-tight flex-1 lg:text-lg">{title}</h1>
      <div className="flex items-center gap-2">{children}</div>
    </header>
  );
}
