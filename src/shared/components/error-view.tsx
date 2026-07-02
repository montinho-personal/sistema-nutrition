"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangleIcon, HomeIcon, RotateCcwIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";

interface ErrorViewProps {
  /** Título curto e humano do problema. */
  title?: string;
  /** Explicação + orientação — nunca só o erro (Documento 02). */
  description?: string;
  /** Ação de recuperação (ex.: `reset` do error boundary de rota). */
  onRetry?: () => void;
  /** Mostra o atalho para voltar ao início. */
  homeHref?: string;
  /** Ocupa a tela inteira (rotas públicas) ou o espaço de conteúdo. */
  fullScreen?: boolean;
}

/**
 * Tela de erro amigável e reutilizável — sempre com um caminho de saída
 * (tentar de novo / voltar ao início). Nunca uma tela quebrada sem solução
 * (Documento 02 — riscos sempre acompanhados de orientação).
 */
export function ErrorView({
  title = "Algo não saiu como esperado",
  description = "O erro foi registrado. Tente novamente — se persistir, recarregue a página.",
  onRetry,
  homeHref,
  fullScreen = false,
}: ErrorViewProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-4 p-8 text-center",
        fullScreen ? "min-h-dvh" : "min-h-[320px]",
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangleIcon className="size-6" />
      </div>
      <div className="flex max-w-sm flex-col gap-1">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCcwIcon className="size-4" />
            Tentar novamente
          </Button>
        ) : null}
        {homeHref ? (
          <Button asChild variant="ghost" size="sm">
            <Link href={homeHref}>
              <HomeIcon className="size-4" />
              Voltar ao início
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
