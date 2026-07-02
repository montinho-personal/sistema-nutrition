"use client";

import * as React from "react";

import { logger } from "@/shared/services/logger";
import { ErrorView } from "@/shared/components/error-view";

/**
 * Error boundary de rota do espaço autenticado. Renderiza dentro do App Shell
 * (o layout permanece), então o usuário nunca perde a navegação num erro.
 */
export default function AppRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    logger.error("Erro em rota do app", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <ErrorView
      title="Esta tela encontrou um problema"
      description="O erro foi registrado. Você pode tentar novamente ou voltar ao painel — seus dados continuam salvos."
      onRetry={reset}
      homeHref="/dashboard"
    />
  );
}
