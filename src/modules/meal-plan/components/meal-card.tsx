"use client";

import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { ROLE_LABELS } from "@/modules/meal-plan/constants/parameters";
import type { MealItem, PlannedMeal } from "@/modules/meal-plan/types";

const ROLE_DOT: Record<MealItem["role"], string> = {
  protein: "bg-gold",
  carb: "bg-foreground/70",
  fat: "bg-muted-foreground/50",
  veg: "bg-success",
};

function ItemRow({ item }: { item: MealItem }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span
        className={`mt-0.5 inline-block size-2 shrink-0 rounded-full ${ROLE_DOT[item.role]}`}
        aria-hidden
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{item.foodName}</span>
        <span className="text-xs text-muted-foreground">
          {item.grams} g
          {item.portionLabel ? ` · ${item.portionLabel}` : ""} · {ROLE_LABELS[item.role]}
        </span>
      </div>
      <div className="shrink-0 text-right text-xs text-muted-foreground tabular-nums">
        <div className="text-sm font-medium text-foreground">{item.kcal} kcal</div>
        <div>
          P{item.protein} · C{item.carbs} · G{item.fat}
        </div>
      </div>
    </div>
  );
}

/** Uma refeição do cardápio: alvo, itens e total. */
export function MealCard({ meal }: { meal: PlannedMeal }) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{meal.title}</span>
          <span className="text-xs text-muted-foreground">
            Alvo {meal.target.kcal} kcal · P{meal.target.protein} C{meal.target.carbs} G
            {meal.target.fat}
          </span>
        </div>
        <Badge variant="secondary" className="tabular-nums">
          {meal.totals.kcal} kcal
        </Badge>
      </CardHeader>
      <CardContent className="divide-y px-4 py-1">
        {meal.items.length === 0 ? (
          <p className="py-3 text-sm text-muted-foreground">
            Sem alimento compatível para esta refeição.
          </p>
        ) : (
          meal.items.map((item) => <ItemRow key={`${meal.slot}-${item.foodId}`} item={item} />)
        )}
      </CardContent>
    </Card>
  );
}
