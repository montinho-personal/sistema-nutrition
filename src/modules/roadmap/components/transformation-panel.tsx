"use client";

import {
  AlertTriangleIcon,
  CalendarClockIcon,
  FlagIcon,
  LightbulbIcon,
  MapPinIcon,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import type { Roadmap } from "@/modules/roadmap/types";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function PanelItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3">
      <span className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {icon}
        {label}
      </span>
      <span className="text-sm">{value ?? "Sem sinal relevante."}</span>
    </div>
  );
}

/** Painel da Transformação (Documento 03E — sempre mostrar). */
export function TransformationPanel({ roadmap }: { roadmap: Roadmap }) {
  const { panel, journey } = roadmap;

  return (
    <Card className="border-l-2 border-l-gold">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPinIcon className="size-4 text-gold" />
          Fase atual: {panel.currentPhaseTitle}
        </CardTitle>
        <Badge variant="secondary">
          {journey.phasesCompleted}/{journey.totalPhases} fases
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm">{panel.currentObjective}</p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <PanelItem
            icon={<AlertTriangleIcon className="size-3.5 text-warning" />}
            label="Maior desafio"
            value={panel.mainChallenge}
          />
          <PanelItem
            icon={<LightbulbIcon className="size-3.5 text-success" />}
            label="Maior oportunidade"
            value={panel.mainOpportunity}
          />
          <PanelItem
            icon={<FlagIcon className="size-3.5 text-gold" />}
            label="Próxima meta"
            value={panel.nextGoal}
          />
          <PanelItem
            icon={<CalendarClockIcon className="size-3.5 text-foreground" />}
            label="Próxima revisão"
            value={panel.nextReview ? formatDate(panel.nextReview) : null}
          />
        </div>
      </CardContent>
    </Card>
  );
}
