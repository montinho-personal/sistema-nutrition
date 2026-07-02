"use client";

import { AppleIcon, TargetIcon } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import {
  COST_BENEFIT_LABELS,
  EVIDENCE_LABELS,
  STATUS_LABELS,
} from "@/modules/supplements/constants/parameters";
import type { SupplementRecommendation, SupplementStatus } from "@/modules/supplements/types";

const STATUS_VARIANT: Record<SupplementStatus, "success" | "warning" | "secondary"> = {
  recommended: "success",
  consider: "warning",
  not_needed: "secondary",
  not_indicated: "secondary",
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

/** Cartão de um suplemento: dificuldade que resolve + alternativa alimentar. */
export function SupplementCard({ item }: { item: SupplementRecommendation }) {
  const { supplement, status, reason } = item;
  const dimmed = status === "not_needed" || status === "not_indicated";

  return (
    <Card className={dimmed ? "opacity-75" : status === "recommended" ? "border-l-2 border-l-gold" : undefined}>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-semibold">{supplement.name}</span>
          <span className="text-sm text-muted-foreground">{supplement.objective}</span>
        </div>
        <Badge variant={STATUS_VARIANT[status]} className="shrink-0">
          {STATUS_LABELS[status]}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
          <TargetIcon className="mt-0.5 size-4 shrink-0 text-gold" />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Qual dificuldade resolve
            </span>
            <span className="text-sm">{supplement.problemSolved}</span>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-success/30 bg-success/5 p-3">
          <AppleIcon className="mt-0.5 size-4 shrink-0 text-success" />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Primeiro a comida
            </span>
            <span className="text-sm">{supplement.foodAlternatives}</span>
          </div>
        </div>

        {!dimmed ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Dose usual" value={supplement.usualDose} />
            <Field label="Quando usar" value={supplement.timing} />
            <Field label="Como age" value={supplement.mechanism} />
            <Field label="Impacto esperado" value={supplement.expectedImpact} />
          </div>
        ) : null}

        <p className="border-t pt-3 text-sm text-muted-foreground">{reason}</p>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-[10px]">
            {EVIDENCE_LABELS[supplement.evidence]}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {COST_BENEFIT_LABELS[supplement.costBenefit]}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
