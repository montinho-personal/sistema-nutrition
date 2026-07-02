"use client";

import * as React from "react";

import { logger } from "@/shared/services/logger";
import { ErrorView } from "@/shared/components/error-view";

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
      return <ErrorView onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
