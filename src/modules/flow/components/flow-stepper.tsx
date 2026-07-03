"use client";

import * as React from "react";
import { CheckIcon, LockIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { FLOW_STEPS } from "@/modules/flow/constants/steps";
import type { FlowData } from "@/modules/flow/hooks/use-flow-data";
import type { FlowStepId } from "@/modules/flow/types";

interface FlowStepperProps {
  currentId: FlowStepId;
  stepState: FlowData["stepState"];
  onSelect: (id: FlowStepId) => void;
}

/**
 * Stepper das 7 etapas: onde estou, o que já concluí e o que ainda está
 * bloqueado. Concluídas e a atual em dourado; bloqueadas ficam inertes. Clicar
 * numa etapa alcançável navega até ela (Workflow V1 — sempre mostrar onde estou).
 */
export function FlowStepper({ currentId, stepState, onSelect }: FlowStepperProps) {
  return (
    <nav aria-label="Etapas do fluxo" className="w-full overflow-x-auto">
      <ol className="flex min-w-max items-center gap-1">
        {FLOW_STEPS.map((step, i) => {
          const state = stepState[step.id];
          const isCurrent = step.id === currentId;
          const status = !state.reachable
            ? "locked"
            : isCurrent
              ? "current"
              : state.done
                ? "done"
                : "todo";
          return (
            <li key={step.id} className="flex items-center gap-1">
              <button
                type="button"
                disabled={!state.reachable}
                aria-current={isCurrent ? "step" : undefined}
                onClick={() => state.reachable && onSelect(step.id)}
                className={cn(
                  "group flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors",
                  state.reachable ? "cursor-pointer hover:bg-accent" : "cursor-default",
                  isCurrent && "bg-accent",
                )}
                title={step.short}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums transition-colors",
                    status === "current" && "bg-gold text-gold-foreground",
                    status === "done" && "bg-gold/15 text-gold ring-1 ring-gold/30",
                    status === "todo" && "bg-muted text-muted-foreground",
                    status === "locked" && "bg-muted/60 text-muted-foreground/60",
                  )}
                >
                  {status === "done" ? (
                    <CheckIcon className="size-3.5" />
                  ) : status === "locked" ? (
                    <LockIcon className="size-3" />
                  ) : (
                    step.order
                  )}
                </span>
                <span
                  className={cn(
                    "text-xs font-medium whitespace-nowrap",
                    isCurrent
                      ? "text-foreground"
                      : state.reachable
                        ? "text-muted-foreground group-hover:text-foreground"
                        : "text-muted-foreground/50",
                  )}
                >
                  {step.title}
                </span>
              </button>
              {i < FLOW_STEPS.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    "h-px w-4 shrink-0",
                    stepState[FLOW_STEPS[i + 1].id].reachable ? "bg-gold/40" : "bg-border",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
