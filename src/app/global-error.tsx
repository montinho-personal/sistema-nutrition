"use client";

import * as React from "react";

import { logger } from "@/shared/services/logger";

/**
 * Fallback catastrófico: um erro no próprio layout raiz. Substitui todo o
 * documento, então traz `html`/`body` e estilos inline (o CSS global pode não
 * ter carregado). Ainda assim, nunca uma tela sem saída (Documento 02).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    logger.error("Erro global (root layout)", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 32,
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#18181b",
          background: "#fff",
        }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
          Não foi possível carregar o aplicativo
        </h1>
        <p style={{ fontSize: 14, color: "#71717a", maxWidth: 360, margin: 0 }}>
          Ocorreu um erro inesperado e ele foi registrado. Tente novamente ou recarregue a página.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "8px 16px",
            fontSize: 14,
            borderRadius: 8,
            border: "1px solid #d4d4d8",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Tentar novamente
        </button>
      </body>
    </html>
  );
}
