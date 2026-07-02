"use client";

import * as React from "react";
import { CloudIcon, CloudOffIcon, LogOutIcon, RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import { getSupabaseBrowser } from "@/database/supabase/client";
import { useSupabaseSession } from "@/modules/sync/hooks/use-supabase-session";
import { useSyncStatus } from "@/modules/sync/hooks/use-sync-status";
import { hydrateFromCloud, type SyncStatus } from "@/modules/sync/services";

const STATUS_LABEL: Record<SyncStatus, string> = {
  off: "Backup desligado",
  syncing: "Sincronizando...",
  synced: "Tudo salvo na nuvem",
  error: "Falha ao sincronizar",
};
const STATUS_VARIANT: Record<SyncStatus, "secondary" | "success" | "warning"> = {
  off: "secondary",
  syncing: "warning",
  synced: "success",
  error: "warning",
};

/** Conta e backup na nuvem (Sprint A). Entrar liga o backup dos seus dados. */
export function SyncSettingsCard() {
  const { user, configured, signOut } = useSupabaseSession();
  const status = useSyncStatus();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  if (!configured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CloudOffIcon className="size-4 text-muted-foreground" />
            Backup na nuvem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            A sincronização não está disponível neste ambiente (Supabase não configurado). No site
            publicado, entre para ativar o backup automático dos seus alunos.
          </p>
        </CardContent>
      </Card>
    );
  }

  const signIn = async () => {
    const client = getSupabaseBrowser();
    if (!client) return;
    setBusy(true);
    try {
      const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        toast.error("Não foi possível entrar", { description: "Confira o e-mail e a senha." });
        return;
      }
      setPassword("");
      toast.success("Conectado! Seus dados agora têm backup na nuvem.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-l-2 border-l-gold">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CloudIcon className="size-4 text-gold" />
          Backup na nuvem
        </CardTitle>
        {user ? <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {user ? (
          <>
            <p className="text-sm text-muted-foreground">
              Conectado como <strong className="text-foreground">{user.email}</strong>. Seus alunos,
              diagnósticos e planos são salvos automaticamente e ficam disponíveis em qualquer
              dispositivo.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => void hydrateFromCloud()}>
                <RefreshCwIcon className="size-4" />
                Sincronizar agora
              </Button>
              <Button size="sm" variant="ghost" onClick={() => void signOut()}>
                <LogOutIcon className="size-4" />
                Sair
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Entre para ativar o <strong className="text-foreground">backup automático</strong> dos
              seus dados. Sem isso, tudo fica apenas neste navegador (e some se o cache for limpo).
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sync-email" className="text-xs">
                  E-mail
                </Label>
                <Input
                  id="sync-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@exemplo.com"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sync-password" className="text-xs">
                  Senha
                </Label>
                <Input
                  id="sync-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <Button
              size="sm"
              className="w-fit"
              onClick={() => void signIn()}
              disabled={busy || !email.trim() || !password}
            >
              <CloudIcon className="size-4" />
              {busy ? "Entrando..." : "Entrar e ativar backup"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
