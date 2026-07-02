"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/shared/lib/utils";
import { appConfig } from "@/config/app";
import { mainNavigation, secondaryNavigation } from "@/config/navigation";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Separator } from "@/shared/components/ui/separator";

/**
 * Sidebar esquerda (Documento 09 — área 2): timeline de módulos da
 * jornada do aluno. Cada item mostrará status quando houver aluno ativo.
 */
function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="flex size-7 items-center justify-center rounded-md bg-gold">
          <span className="text-xs font-bold text-gold-foreground">M</span>
        </div>
        <span className="truncate text-sm font-semibold tracking-tight">{appConfig.shortName}</span>
      </div>
      <Separator className="bg-sidebar-border" />
      <ScrollArea className="flex-1 px-2 py-3">
        <nav aria-label="Navegação principal" className="flex flex-col gap-0.5">
          {mainNavigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="size-4 shrink-0" aria-hidden />
                <span className="truncate">{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <Separator className="bg-sidebar-border" />
      <nav aria-label="Navegação secundária" className="flex flex-col gap-0.5 px-2 py-3">
        {secondaryNavigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <item.icon className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export { AppSidebar };
