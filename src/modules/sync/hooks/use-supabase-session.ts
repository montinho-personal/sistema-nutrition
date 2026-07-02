"use client";

import * as React from "react";
import type { User } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/config/env";
import { getSupabaseBrowser } from "@/database/supabase/client";

/** Sessão do Supabase Auth (usuário logado) — base da sincronização. */
export function useSupabaseSession() {
  const [user, setUser] = React.useState<User | null>(null);
  // Sem Supabase, já está "pronto" (nunca haverá sessão).
  const [ready, setReady] = React.useState(!isSupabaseConfigured);

  React.useEffect(() => {
    const client = getSupabaseBrowser();
    if (!client) return;
    let active = true;

    client.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setReady(true);
    });

    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = React.useCallback(async () => {
    const client = getSupabaseBrowser();
    if (client) await client.auth.signOut();
  }, []);

  return { user, ready, signOut, configured: isSupabaseConfigured };
}
