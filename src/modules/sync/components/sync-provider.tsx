"use client";

import * as React from "react";

import { useSupabaseSession } from "@/modules/sync/hooks/use-supabase-session";
import { configureSync, hydrateFromCloud, setSyncEnabled } from "@/modules/sync/services/cloudSync";
import { StorageAlerts } from "@/modules/sync/components/storage-alerts";

/**
 * Liga a sincronização na nuvem quando há sessão (Sprint A). Aditivo: se não
 * houver login/Supabase, não faz nada e o app segue local-first.
 */
export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSupabaseSession();

  React.useEffect(() => {
    configureSync();
  }, []);

  React.useEffect(() => {
    if (user) {
      setSyncEnabled(true);
      void hydrateFromCloud();
    } else {
      setSyncEnabled(false);
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <StorageAlerts />
      {children}
    </>
  );
}
