"use client";

import * as React from "react";

import { cn } from "@/shared/lib/utils";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { classifyFood } from "@/modules/foods/services";
import { scoreToLevel } from "@/modules/foods/services";
import { QUALITATIVE_LABELS } from "@/modules/foods/constants";
import type { Food } from "@/modules/foods/types";
import { FoodClassificationBadge } from "@/modules/foods/components/food-classification-badge";

interface FoodCardProps {
  food: Food;
  onSelect?: (food: Food) => void;
}

/** Cartão resumido de um alimento na lista do banco inteligente. */
export function FoodCard({ food, onSelect }: FoodCardProps) {
  const assessment = classifyFood(food);
  const satiety = scoreToLevel(food.attributes.satietyScore);
  const { energyKcal, proteinG, carbsG, fatG } = food.nutrition;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(food)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(food);
        }
      }}
      className={cn(
        "cursor-pointer gap-3 py-4 transition-colors hover:border-ring/60",
        "outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
      )}
    >
      <CardContent className="flex flex-col gap-3 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-sm font-medium">{food.name}</span>
            <span className="text-xs text-muted-foreground">
              {food.categoryName} · {food.sourceName}
            </span>
          </div>
          <FoodClassificationBadge classification={assessment.classification} />
        </div>

        <div className="grid grid-cols-4 gap-2 text-center">
          <Macro label="kcal" value={energyKcal} />
          <Macro label="P" value={proteinG} unit="g" />
          <Macro label="C" value={carbsG} unit="g" />
          <Macro label="G" value={fatG} unit="g" />
        </div>

        <div className="flex flex-wrap gap-1">
          {satiety ? (
            <Badge variant="outline" className="text-[10px]">
              Saciedade {QUALITATIVE_LABELS[satiety].toLowerCase()}
            </Badge>
          ) : null}
          {food.tags.slice(0, 3).map((tag) => (
            <Badge key={tag.name} variant="secondary" className="text-[10px]">
              {tag.name}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function Macro({ label, value, unit }: { label: string; value: number | null; unit?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-sm font-semibold tabular-nums">
        {value === null ? "—" : Math.round(value)}
        {unit && value !== null ? (
          <span className="text-xs text-muted-foreground">{unit}</span>
        ) : null}
      </span>
      <span className="text-[10px] tracking-wide text-muted-foreground uppercase">{label}</span>
    </div>
  );
}
