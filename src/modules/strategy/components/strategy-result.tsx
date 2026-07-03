"use client";

import * as React from "react";
import { GaugeIcon, LayersIcon, SlidersHorizontalIcon, UtensilsIcon } from "lucide-react";

import { DecisionCard } from "@/shared/components/decision-card";
import { SectionHeader } from "@/shared/components/section-header";
import { referencesFor } from "@/modules/knowledge/services";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  FLEXIBILITY_LABELS,
  PHILOSOPHY_LABELS,
  VELOCITY_LABELS,
} from "@/modules/strategy/constants/parameters";
import type { NutritionStrategy } from "@/modules/strategy/types";

function Pill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="gap-0 py-3">
      <CardContent className="flex items-center gap-3 px-4">
        <span className="text-gold [&>svg]:size-4">{icon}</span>
        <div className="flex min-w-0 flex-col">
          <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </span>
          <span className="truncate text-sm font-medium">{value}</span>
        </div>
      </CardContent>
    </Card>
  );
}

/** A Estratégia Nutricional: síntese + as 12 decisões justificadas (Doc 04). */
export function StrategyResult({ strategy }: { strategy: NutritionStrategy }) {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <SectionHeader
          title="Estratégia Nutricional"
          description="A arquitetura da alimentação, definida antes de qualquer caloria."
        />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Pill icon={<GaugeIcon />} label="Velocidade" value={VELOCITY_LABELS[strategy.velocity]} />
          <Pill
            icon={<LayersIcon />}
            label="Filosofia"
            value={PHILOSOPHY_LABELS[strategy.philosophy]}
          />
          <Pill
            icon={<SlidersHorizontalIcon />}
            label="Flexibilidade"
            value={FLEXIBILITY_LABELS[strategy.flexibility]}
          />
          <Pill
            icon={<UtensilsIcon />}
            label="Refeições/dia"
            value={String(strategy.mealsPerDay)}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader
          title="As 12 decisões"
          description="Cada escolha do Strategic Prescription Engine, com sua justificativa técnica."
        />
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {strategy.decisions.map((d) => (
            <DecisionCard
              key={d.id}
              decision={`${d.step}. ${d.title}: ${d.decision}`}
              reason={d.reason}
              benefits={d.benefits}
              risks={d.risks}
              alternatives={d.alternatives}
              references={referencesFor(d.knowledgeIds)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
