"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { appConfig } from "@/config/app";
import { mainNavigation, secondaryNavigation } from "@/config/navigation";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/ui/sheet";
import type { NavigationItem } from "@/config/navigation";

/**
 * Navegação mobile (Documento 09): abaixo de `md`, a sidebar some — este
 * menu (hambúrguer + drawer) devolve o acesso a todos os módulos no celular.
 * Reutiliza a mesma configuração de navegação da sidebar (nunca duplicar).
 */
export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  const renderLink = (item: NavigationItem) => {
    const isActive = pathname.startsWith(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setOpen(false)}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
          isActive
            ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
            : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
        )}
      >
        <item.icon className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{item.title}</span>
      </Link>
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
          <MenuIcon className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 gap-0 p-0">
        <SheetHeader className="flex-row items-center gap-2 border-b p-4">
          <div className="flex size-7 items-center justify-center rounded-md bg-gold">
            <span className="text-xs font-bold text-gold-foreground">M</span>
          </div>
          <SheetTitle className="text-sm font-semibold tracking-tight">
            {appConfig.shortName}
          </SheetTitle>
        </SheetHeader>
        <nav aria-label="Navegação principal" className="flex flex-col gap-0.5 p-2">
          {mainNavigation.map(renderLink)}
        </nav>
        <Separator />
        <nav aria-label="Navegação secundária" className="flex flex-col gap-0.5 p-2">
          {secondaryNavigation.map(renderLink)}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
