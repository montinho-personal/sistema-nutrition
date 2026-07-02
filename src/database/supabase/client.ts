import { createBrowserClient } from "@supabase/ssr";

import { env, isSupabaseConfigured } from "@/config/env";
import { ConfigurationError } from "@/shared/services/errors";

/**
 * Cliente Supabase para o navegador (Client Components).
 * Criado sob demanda — nunca no escopo do módulo, para não quebrar
 * ambientes sem configuração (build, preview).
 */
export function createSupabaseBrowserClient(schema: string = env.NEXT_PUBLIC_SUPABASE_SCHEMA) {
  if (!isSupabaseConfigured) {
    throw new ConfigurationError({
      message: "Supabase não está configurado neste ambiente.",
      solution:
        "Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local (veja .env.example).",
    });
  }

  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    // Queries (.from) usam o schema informado (por padrão o dedicado). As
    // funções públicas da anamnese usam `public`; Auth não é afetado.
    db: { schema },
  });
}

// Instância única para Auth e sync — mantém a sessão estável entre chamadas.
let browserSingleton: ReturnType<typeof createSupabaseBrowserClient> | null = null;

/** Cliente de navegador reutilizável (sessão persistida). Null se não configurado. */
export function getSupabaseBrowser() {
  if (!isSupabaseConfigured) return null;
  // Schema `public`: onde vivem as funções de sync/anamnese e o Auth.
  browserSingleton ??= createSupabaseBrowserClient("public");
  return browserSingleton;
}
