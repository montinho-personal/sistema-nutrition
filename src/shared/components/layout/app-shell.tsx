"use client";

import * as React from "react";

import { cn } from "@/shared/lib/utils";
import { AppHeader } from "@/shared/components/layout/app-header";
import { AppSidebar } from "@/shared/components/layout/app-sidebar";
import { AiStrategyPanel } from "@/shared/components/layout/ai-strategy-panel";
import { InsightsPanel } from "@/shared/components/layout/insights-panel";
import { ErrorBoundary } from "@/shared/components/error-boundary";

/**
 * App Shell — layout de 5 áreas da Central de Decisão (Documento 09):
 *
 * ┌──────────────────────────────────────────────────────┐
 * │ 1. Header                                            │
 * ├──────────┬───────────────────┬────────────┬──────────┤
 * │ 2.       │ 3. Workspace      │ 4.         │ 5. AI    │
 * │ Sidebar  │    Central        │ Insights   │ Strategy │
 * └──────────┴───────────────────┴────────────┴──────────┘
 *
 * Os painéis de inteligência (4 e 5) são recolhíveis (Modo Foco),
 * mas o AI Strategy Panel nunca é ocultado completamente por padrão.
 */
function AppShell({ children }: { children: React.ReactNode }) {
  const [showIntelligencePanels, setShowIntelligencePanels] = React.useState(true);

  return (
    <div className="flex h-dvh overflow-hidden print:h-auto print:overflow-visible">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          onToggleIntelligencePanels={() => setShowIntelligencePanels((current) => !current)}
        />
        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-y-auto print:overflow-visible">
            <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6 print:max-w-none print:p-0">
              <ErrorBoundary>{children}</ErrorBoundary>
            </div>
          </main>
          <div
            className={cn(
              "hidden w-[560px] shrink-0 grid-cols-2 xl:grid print:hidden",
              !showIntelligencePanels && "xl:hidden",
            )}
          >
            <InsightsPanel />
            <AiStrategyPanel />
          </div>
        </div>
        <footer className="flex h-8 shrink-0 items-center justify-end border-t px-4 text-[11px] text-muted-foreground print:hidden">
          Montinho Nutrition Strategy
        </footer>
      </div>
    </div>
  );
}

export { AppShell };
