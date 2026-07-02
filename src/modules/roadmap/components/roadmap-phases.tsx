"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Timeline, type TimelineItem } from "@/shared/components/timeline";
import { SectionHeader } from "@/shared/components/section-header";
import type { Roadmap, RoadmapPhase } from "@/modules/roadmap/types";

function PhaseDetail({ phase }: { phase: RoadmapPhase }) {
  const rows: { label: string; value: string }[] = [
    { label: "Problema que resolve", value: phase.problem },
    { label: "Por que existe", value: phase.why },
    { label: "Quando termina", value: phase.exitCriterion },
    { label: "Indicador de sucesso", value: phase.successIndicator },
  ];
  return (
    <Card className="border-l-2 border-l-gold">
      <CardHeader>
        <CardTitle className="text-base">
          Fase {phase.position} · {phase.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm">{phase.objective}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col gap-0.5">
              <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {row.label}
              </span>
              <span className="text-sm">{row.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** As 7 fases da jornada (linha do tempo) + detalhe da fase atual. */
export function RoadmapPhases({ roadmap }: { roadmap: Roadmap }) {
  const current = roadmap.phases.find((p) => p.status === "current") ?? roadmap.phases[0];
  const items: TimelineItem[] = roadmap.phases.map((p) => ({
    id: p.key,
    title: p.title,
    description: p.objective,
    status: p.status,
  }));

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="As 7 fases da transformação"
        description="O sistema entrega um caminho, não uma dieta (Documento 03E)."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <Card>
          <CardContent className="pt-6">
            <Timeline items={items} />
          </CardContent>
        </Card>
        <PhaseDetail phase={current} />
      </div>
    </div>
  );
}
