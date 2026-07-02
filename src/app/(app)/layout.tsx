import { AppShell } from "@/shared/components/layout/app-shell";
import { SyncProvider } from "@/modules/sync/components/sync-provider";

/**
 * Layout do espaço autenticado — Central de Decisão (Documento 09).
 * A proteção de rota acontece no proxy de sessão (src/proxy.ts).
 * O SyncProvider ativa o backup na nuvem quando há sessão (Sprint A).
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SyncProvider>
      <AppShell>{children}</AppShell>
    </SyncProvider>
  );
}
