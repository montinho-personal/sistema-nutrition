"use client";

import * as React from "react";

import { logger } from "@/shared/services/logger";
import { ErrorView } from "@/shared/components/error-view";

/**
 * Error boundary do segmento raiz — cobre as rotas públicas (login, anamnese).
 * O layout raiz (tema, fontes) permanece.
 */
export default function RootRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    logger.error("Erro em rota pública", { message: error.message, digest: error.digest });
  }, [error]);

  return <ErrorView onRetry={reset} homeHref="/" fullScreen />;
}
