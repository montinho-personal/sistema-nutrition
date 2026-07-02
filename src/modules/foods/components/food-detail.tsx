"use client";

import * as React from "react";
import { AlertTriangleIcon } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import { ScoreCard } from "@/shared/components/score-card";
import { buildFoodAlerts, classifyFood, energyDensityLevel } from "@/modules/foods/services";
import {
  COST_LABELS,
  GOAL_LABELS,
  PROCESSING_LABELS,
  QUALITATIVE_LABELS,
  TIMING_LABELS,
} from "@/modules/foods/constants";
import type { Food } from "@/modules/foods/types";
import { FoodClassificationBadge } from "@/modules/foods/components/food-classification-badge";

interface FoodDetailProps {
  food: Food | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Perfil completo do alimento (Documento 15): classificação com
 * justificativas, scores, nutrição, perfis prático/logístico, tags,
 * medidas caseiras e alertas contextuais com orientação.
 */
export function FoodDetail({ food, open, onOpenChange }: FoodDetailProps) {
  if (!food) return null;

  const assessment = classifyFood(food);
  const alerts = buildFoodAlerts(food);
  const density = energyDensityLevel(food);
  const { nutrition: n, attributes: a } = food;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <FoodClassificationBadge classification={assessment.classification} />
            <Badge variant="outline" className="text-[10px]">
              {food.sourceName}
            </Badge>
          </div>
          <SheetTitle>{food.name}</SheetTitle>
          <SheetDescription>
            {food.categoryName}
            {food.processingLevel ? ` · ${PROCESSING_LABELS[food.processingLevel]}` : ""}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-5 p-4">
            {/* Justificativa da classificação (transparência) */}
            <section className="flex flex-col gap-1.5">
              <SectionLabel>Por que esta classificação</SectionLabel>
              <ul className="list-inside list-disc space-y-0.5 text-sm text-muted-foreground">
                {assessment.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </section>

            {/* Alertas contextuais */}
            {alerts.length > 0 ? (
              <section className="flex flex-col gap-2">
                <SectionLabel>Pontos de atenção</SectionLabel>
                {alerts.map((alert) => (
                  <div
                    key={alert.kind}
                    className="flex items-start gap-2 rounded-md bg-warning/10 p-2.5 text-sm"
                  >
                    <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-warning" />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{alert.message}</span>
                      <span className="text-xs text-muted-foreground">{alert.guidance}</span>
                    </div>
                  </div>
                ))}
              </section>
            ) : null}

            {/* Nutrição por 100 g */}
            <section className="flex flex-col gap-2">
              <SectionLabel>Composição por 100 g</SectionLabel>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <NutrientRow label="Energia" value={n.energyKcal} unit="kcal" />
                <NutrientRow label="Proteínas" value={n.proteinG} unit="g" />
                <NutrientRow label="Carboidratos" value={n.carbsG} unit="g" />
                <NutrientRow label="Gorduras" value={n.fatG} unit="g" />
                <NutrientRow label="Fibras" value={n.fiberG} unit="g" />
                <NutrientRow label="Açúcares" value={n.sugarG} unit="g" />
                <NutrientRow label="Gord. saturada" value={n.saturatedFatG} unit="g" />
                <NutrientRow label="Sódio" value={n.sodiumMg} unit="mg" />
              </div>
              {density ? (
                <span className="text-xs text-muted-foreground">
                  Densidade energética: {QUALITATIVE_LABELS[density].toLowerCase()}
                </span>
              ) : null}
            </section>

            {/* Scores estratégicos */}
            <section className="flex flex-col gap-2">
              <SectionLabel>Perfis estratégicos</SectionLabel>
              <div className="grid grid-cols-2 gap-2">
                {a.satietyScore !== null ? (
                  <ScoreCard label="Saciedade" score={a.satietyScore} />
                ) : null}
                {a.practicalityScore !== null ? (
                  <ScoreCard label="Praticidade" score={a.practicalityScore} />
                ) : null}
                {a.digestibilityScore !== null ? (
                  <ScoreCard label="Digestibilidade" score={a.digestibilityScore} />
                ) : null}
                {a.acceptanceScore !== null ? (
                  <ScoreCard label="Aceitação" score={a.acceptanceScore} />
                ) : null}
              </div>
            </section>

            {/* Praticidade & logística */}
            <section className="flex flex-col gap-2">
              <SectionLabel>Praticidade e logística</SectionLabel>
              <div className="flex flex-col gap-1 text-sm">
                <FactRow label="Custo" value={a.costRange ? COST_LABELS[a.costRange] : null} />
                <FactRow
                  label="Preparo"
                  value={a.prepTimeMinutes !== null ? `${a.prepTimeMinutes} min` : null}
                />
                <BoolRow label="Congela bem" value={a.freezesWell} />
                <BoolRow label="Portátil" value={a.portability} />
                <BoolRow label="Bom para marmita" value={a.goodForLunchbox} />
                <BoolRow label="Controle da fome" value={a.goodForHungerControl} />
              </div>
            </section>

            {/* Objetivos e momentos */}
            <section className="flex flex-col gap-2">
              <SectionLabel>Quando faz sentido</SectionLabel>
              <div className="flex flex-wrap gap-1">
                {a.bestTimes.map((t) => (
                  <Badge key={t} variant="secondary" className="text-[10px]">
                    {TIMING_LABELS[t]}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {a.suitableGoals.map((g) => (
                  <Badge key={g} variant="gold" className="text-[10px]">
                    {GOAL_LABELS[g]}
                  </Badge>
                ))}
              </div>
              {a.strategicApplications ? (
                <p className="text-sm text-muted-foreground">{a.strategicApplications}</p>
              ) : null}
            </section>

            {/* Medidas caseiras */}
            {food.portions.length > 0 ? (
              <section className="flex flex-col gap-2">
                <SectionLabel>Medidas caseiras</SectionLabel>
                <div className="flex flex-col gap-1 text-sm">
                  {food.portions.map((p) => (
                    <FactRow key={p.name} label={p.name} value={`${p.grams} g`} />
                  ))}
                </div>
              </section>
            ) : null}

            {/* Tags */}
            <section className="flex flex-col gap-2">
              <SectionLabel>Tags</SectionLabel>
              <div className="flex flex-wrap gap-1">
                {food.tags.map((tag) => (
                  <Badge key={tag.name} variant="outline" className="text-[10px]">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </section>

            <Separator />
            <p className="text-[11px] text-muted-foreground">
              Fonte: {food.sourceName} · confiança dos dados: {food.dataConfidence}.
            </p>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
      {children}
    </span>
  );
}

function NutrientRow({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | null;
  unit: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value === null ? "—" : `${value} ${unit}`}</span>
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value ?? "—"}</span>
    </div>
  );
}

function BoolRow({ label, value }: { label: string; value: boolean | null }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value === null ? "—" : value ? "Sim" : "Não"}</span>
    </div>
  );
}
