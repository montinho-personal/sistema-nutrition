import {
  CalendarCheckIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  MapIcon,
  PillIcon,
  SaladIcon,
  SettingsIcon,
  StethoscopeIcon,
  TargetIcon,
  UsersIcon,
  UtensilsIcon,
  type LucideIcon,
} from "lucide-react";

/**
 * Navegação principal (Documento 13).
 * A ordem espelha a Hierarquia das Decisões (Documento 00):
 * diagnóstico → estratégia → plano → alimentos → suplementação →
 * roadmap → acompanhamentos → relatórios.
 */

export interface NavigationItem {
  /** Título exibido na sidebar. */
  title: string;
  /** Rota da aplicação. */
  href: string;
  /** Ícone lucide. */
  icon: LucideIcon;
}

export const mainNavigation: NavigationItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
  { title: "Alunos", href: "/students", icon: UsersIcon },
  { title: "Diagnóstico", href: "/diagnosis", icon: StethoscopeIcon },
  { title: "Estratégia", href: "/strategy", icon: TargetIcon },
  { title: "Plano Alimentar", href: "/meal-plan", icon: UtensilsIcon },
  { title: "Alimentos", href: "/foods", icon: SaladIcon },
  { title: "Suplementação", href: "/supplements", icon: PillIcon },
  { title: "Roadmap", href: "/roadmap", icon: MapIcon },
  { title: "Acompanhamentos", href: "/follow-ups", icon: CalendarCheckIcon },
  { title: "Relatórios", href: "/reports", icon: FileTextIcon },
];

export const secondaryNavigation: NavigationItem[] = [
  { title: "Configurações", href: "/settings", icon: SettingsIcon },
];
