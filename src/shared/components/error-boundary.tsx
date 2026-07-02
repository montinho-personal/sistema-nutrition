"use client";

import * as React from "react";
import { AlertTriangleIcon } from "lucide-react";

import { logger } from "@/shared/services/logger";
import { Button } from "@/shared/components/ui/button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Conteúdo alternativo em caso de erro. */
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Error Boundary global: captura erros de renderização, registra no
 * sistema de logs e exibe orientação de recuperação — nunca uma tela
 * quebrada sem solução (Documento 02 — Alertas).
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error("Erro de renderização capturado pelo ErrorBoundary", {
      error: error.message,
      componentStack: errorInfo.componentStack ?? undefined,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangleIcon className="size-6" />
          </div>
          <div className="flex max-w-sm flex-col gap-1">
            <h3 className="text-sm font-semibold">Algo não saiu como esperado</h3>
            <p className="text-sm text-muted-foreground">
              O erro foi registrado. Tente novamente — se persistir, recarregue a página.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={this.handleRetry}>
            Tentar novamente
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
