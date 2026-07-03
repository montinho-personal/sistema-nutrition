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
  // Exige login para acessar o app do treinador. Por padrão o app é aberto
  // (uso pessoal local-first); mesmo com o Supabase conectado só para a
  // anamnese, o app segue sem login a menos que isto seja "true".
  NEXT_PUBLIC_REQUIRE_AUTH: z.string().optional(),
  // IA opcional (V2). Chave secreta da Anthropic (server-only) para enriquecer
  // a análise do recordatório. Sem ela, tudo segue determinístico (sem custo).
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  // Modelo da IA. Padrão: o mais barato atual (Haiku 4.5). Ajustável por env.
  ANTHROPIC_MODEL: z.string().min(1).default("claude-haiku-4-5"),
  // Mostra ao cliente o botão "Aprofundar com IA". Ligar junto com a chave.
  NEXT_PUBLIC_AI_ENABLED: z.string().optional(),
});

const parsed = environmentSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_SCHEMA: process.env.NEXT_PUBLIC_SUPABASE_SCHEMA,
  NEXT_PUBLIC_REQUIRE_AUTH: process.env.NEXT_PUBLIC_REQUIRE_AUTH,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
  NEXT_PUBLIC_AI_ENABLED: process.env.NEXT_PUBLIC_AI_ENABLED,
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

/** Se o app do treinador exige login (opt-in — padrão: aberto). */
export const isAuthRequired = env.NEXT_PUBLIC_REQUIRE_AUTH === "true";

/** Se a IA está configurada (chave presente). Só é verdadeiro no servidor. */
export const isAiConfigured = Boolean(env.ANTHROPIC_API_KEY);

/** Sinal visível ao cliente de que a IA está habilitada (mostra o botão). */
export const isAiEnabled = env.NEXT_PUBLIC_AI_ENABLED === "true";
