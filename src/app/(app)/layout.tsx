import { AppShell } from "@/shared/components/layout/app-shell";

/**
 * Layout do espaço autenticado — Central de Decisão (Documento 09).
 * A proteção de rota acontece no proxy de sessão (src/proxy.ts).
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
