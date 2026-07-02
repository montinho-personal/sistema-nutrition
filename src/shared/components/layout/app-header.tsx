"use client";

import * as React from "react";
import { MoonIcon, PanelRightIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { appConfig } from "@/config/app";
import { Button } from "@/shared/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";

interface AppHeaderProps {
  /** Alterna a visibilidade dos painéis de inteligência (Insights + IA). */
  onToggleIntelligencePanels?: () => void;
}

/**
 * Header global (Documento 09 — área 1).
 * Quando houver aluno ativo, exibirá nome, objetivo, status e ações
 * (gerar estratégia, gerar documento). Sem aluno, apresenta o produto.
 */
function AppHeader({ onToggleIntelligencePanels }: AppHeaderProps) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
      <div className="flex min-w-0 items-center gap-3">
        <h1 className="truncate text-sm font-medium">{appConfig.name}</h1>
      </div>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Alternar tema"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              {/* Ícone controlado por CSS para evitar divergência de hidratação */}
              <SunIcon className="hidden size-4 dark:block" />
              <MoonIcon className="size-4 dark:hidden" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Alternar tema</TooltipContent>
        </Tooltip>
        {onToggleIntelligencePanels ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Alternar painéis de inteligência"
                onClick={onToggleIntelligencePanels}
              >
                <PanelRightIcon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Painéis de inteligência</TooltipContent>
          </Tooltip>
        ) : null}
      </div>
    </header>
  );
}

export { AppHeader };
