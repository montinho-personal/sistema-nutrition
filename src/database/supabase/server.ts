import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { env, isSupabaseConfigured } from "@/config/env";
import { ConfigurationError } from "@/shared/services/errors";

/**
 * Cliente Supabase para o servidor (Server Components, Server Actions,
 * Route Handlers). A sessão vive em cookies gerenciados pelo @supabase/ssr.
 */
export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured) {
    throw new ConfigurationError({
      message: "Supabase não está configurado neste ambiente.",
      solution:
        "Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local (veja .env.example).",
    });
  }

  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    // Queries (.from) usam o schema dedicado; Auth não é afetado.
    db: { schema: env.NEXT_PUBLIC_SUPABASE_SCHEMA },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Chamado a partir de um Server Component: cookies são
          // atualizados pelo proxy de sessão (src/proxy.ts).
        }
      },
    },
  });
}

/**
 * Usuário autenticado atual, ou null.
 * Retorna null também quando o Supabase não está configurado,
 * permitindo desenvolvimento da interface sem backend.
 */
export async function getCurrentUser() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
