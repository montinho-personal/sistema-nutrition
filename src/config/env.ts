import { z } from "zod";

/**
 * Sistema de Configuração de ambiente (Documento 11).
 *
 * Todas as variáveis de ambiente são validadas com Zod em um único
 * ponto. Nenhum `process.env` espalhado pelo código.
 */

const environmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  // Schema do banco onde o sistema vive. Permite instalar dentro de um projeto
  // Supabase existente sem colidir com outros apps. Deve casar com o schema das
  // migrações (padrão: montinho).
  NEXT_PUBLIC_SUPABASE_SCHEMA: z.string().min(1).default("montinho"),
});

const parsed = environmentSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_SCHEMA: process.env.NEXT_PUBLIC_SUPABASE_SCHEMA,
});

if (!parsed.success) {
  throw new Error(
    `Variáveis de ambiente inválidas: ${parsed.error.issues
      .map((issue) => issue.path.join("."))
      .join(", ")}. Consulte o arquivo .env.example.`,
  );
}

export const env = parsed.data;

/**
 * Indica se o Supabase está configurado neste ambiente.
 * Permite executar a interface localmente antes de conectar o projeto.
 */
export const isSupabaseConfigured = Boolean(
  env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
