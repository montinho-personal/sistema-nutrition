"use client";

import * as React from "react";
import { CheckIcon, LockIcon, UtensilsIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import { EmptyState } from "@/shared/components/empty-state";
import { SectionHeader } from "@/shared/components/section-header";
import { MetricCard } from "@/shared/components/metric-card";
import {
  DIET_APPROACHES,
  DIET_APPROACH_ORDER,
} from "@/modules/strategy/constants/dietApproaches";
import { suggestDietApproach } from "@/modules/strategy/services";
import { useMacroControls } from "@/modules/strategy/hooks/use-macro-controls";
import type { FlowData } from "@/modules/flow/hooks/use-flow-data";

/**
 * Etapa 4 do fluxo — Estratégia Alimentar. A IA sugere a abordagem; trocá-la
 * redistribui macros e refeições em tempo real, sem perder o resto da estratégia.
 */
export function FlowDietStep({ data, studentId }: { data: FlowData; studentId: string }) {
  const { student, strategy, macros } = data;
  const { input, setDietApproach } = useMacroControls(studentId);

  if (!student?.mainGoal || !strategy) {
    return (
      <EmptyState
        icon={<LockIcon />}
        title="Conclua a etapa anterior"
        description="Defina a estratégia do aluno antes de escolher a abordagem alimentar."
      />
    );
  }

  const suggestedId = suggestDietApproach(student.mainGoal);
  const currentId = input?.dietApproach ?? suggestedId;
  const meals = DIET_APPROACHES[currentId].meals ?? strategy.mealsPerDay;

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        title="Escolha da estratégia alimentar"
        description="A abordagem molda a distribuição dos macros e as refeições — as calorias seguem a estratégia."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DIET_APPROACH_ORDER.map((id) => {
          const a = DIET_APPROACHES[id];
          const selected = id === currentId;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setDietApproach(id)}
              aria-pressed={selected}
              className={cn(
                "flex flex-col gap-2 rounded-xl border p-4 text-left transition-colors",
                selected
                  ? "border-gold bg-gold/5 ring-1 ring-gold/30"
                  : "hover:border-gold/50 hover:bg-accent",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{a.label}</span>
                {selected ? (
                  <CheckIcon className="size-4 shrink-0 text-gold" />
                ) : id === suggestedId ? (
                  <Badge variant="secondary" className="text-[10px]">
                    Sugerida
                  </Badge>
                ) : null}
              </div>
              <span className="text-[11px] font-medium tracking-wide text-gold uppercase">
                {a.emphasis}
              </span>
              <span className="text-xs leading-relaxed text-muted-foreground">{a.description}</span>
            </button>
          );
        })}
      </div>

      {/* Resultado da abordagem — muda ao vivo ao trocar */}
      {macros ? (
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <UtensilsIcon className="size-3.5" />
            {DIET_APPROACHES[currentId].label} · {meals} refeições/dia
          </span>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard label="Calorias" value={`${macros.calories} kcal`} />
            <MetricCard label="Proteína" value={`${macros.proteinG} g`} />
            <MetricCard label="Carboidrato" value={`${macros.carbG} g`} />
            <MetricCard label="Gordura" value={`${macros.fatG} g`} />
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Informe o peso do aluno na Etapa 3 para ver a distribuição dos macros por abordagem.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
