import type { Metadata } from "next";

import { appConfig } from "@/config/app";
import { isSupabaseConfigured } from "@/config/env";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { LoginForm } from "@/app/(auth)/login/login-form";

export const metadata: Metadata = { title: "Entrar" };

/**
 * Tela de login (Supabase Auth).
 * Uso individual nesta fase — arquitetura preparada para múltiplos
 * usuários no futuro (Documento 08).
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-10 items-center justify-center rounded-lg bg-gold">
            <span className="text-sm font-bold text-gold-foreground">M</span>
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold tracking-tight">{appConfig.name}</h1>
            <p className="text-sm text-muted-foreground">
              Sistema Inteligente de Decisão Nutricional
            </p>
          </div>
        </div>

        {isSupabaseConfigured ? (
          <LoginForm />
        ) : (
          <Alert variant="warning">
            <AlertTitle>Supabase não configurado</AlertTitle>
            <AlertDescription>
              Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local
              (veja .env.example) para habilitar a autenticação.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
