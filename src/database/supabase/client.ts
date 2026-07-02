import { createBrowserClient } from "@supabase/ssr";

import { env, isSupabaseConfigured } from "@/config/env";
import { ConfigurationError } from "@/shared/services/errors";

/**
 * Cliente Supabase para o navegador (Client Components).
 * Criado sob demanda — nunca no escopo do módulo, para não quebrar
 * ambientes sem configuração (build, preview).
 */
export function createSupabaseBrowserClient() {
  if (!isSupabaseConfigured) {
    throw new ConfigurationError({
      message: "Supabase não está configurado neste ambiente.",
      solution:
        "Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local (veja .env.example).",
    });
  }

  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    // Queries (.from) usam o schema dedicado; Auth não é afetado.
    db: { schema: env.NEXT_PUBLIC_SUPABASE_SCHEMA },
  });
}
