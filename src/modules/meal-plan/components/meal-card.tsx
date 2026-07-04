"use client";

import * as React from "react";
import {
  BackpackIcon,
  BadgeDollarSignIcon,
  ClockIcon,
  HandPlatterIcon,
  RepeatIcon,
  RotateCcwIcon,
} from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { ROLE_LABELS } from "@/modules/meal-plan/constants/parameters";
import {
  buildDietaryFilter,
  buildSwapItem,
  classifyRole,
  findFoodSwaps,
} from "@/modules/meal-plan/services";
import { matchesQuery } from "@/modules/foods/services";
import type { CostRange, Food, MealTiming } from "@/modules/foods/types";
import type { FoodRole, MealItem, MealSlot, PlannedMeal } from "@/modules/meal-plan/types";

const ROLE_DOT: Record<FoodRole, string> = {
  protein: "bg-gold",
  carb: "bg-foreground/70",
  legume: "bg-amber-700",
  fat: "bg-muted-foreground/50",
  veg: "bg-success",
};

const COST_LABEL: Record<CostRange, string> = {
  very_low: "Barato",
  low: "Barato",
  medium: "Médio",
  high: "Caro",
  very_high: "Caro",
};

function levelLabel(score: number | null): string {
  if (score === null) return "—";
  return score >= 70 ? "Alta" : score >= 45 ? "Média" : "Baixa";
}

/** Chips de atributos do alimento (Food Intelligence — o "porquê" da escolha). */
function FoodAttrs({ food }: { food: Food }) {
  const a = food.attributes;
  const chips: { icon: React.ReactNode; text: string }[] = [
    { icon: <HandPlatterIcon />, text: `Saciedade ${levelLabel(a.satietyScore)}` },
    { icon: <RepeatIcon />, text: `Praticidade ${levelLabel(a.practicalityScore)}` },
  ];
  if (a.costRange) chips.push({ icon: <BadgeDollarSignIcon />, text: COST_LABEL[a.costRange] });
  chips.push({
    icon: <ClockIcon />,
    text: a.prepTimeMinutes && a.prepTimeMinutes > 0 ? `${a.prepTimeMinutes} min` : "Pronto",
  });
  if (a.portability || a.goodForTravel) chips.push({ icon: <BackpackIcon />, text: "Portátil" });
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
      {chips.map((c) => (
        <span key={c.text} className="flex items-center gap-1 [&>svg]:size-3">
          {c.icon}
          {c.text}
        </span>
      ))}
    </div>
  );
}

interface SwapPanelProps {
  item: MealItem;
  foods: Food[];
  restrictions: string[];
  /** Horário da refeição — mantém os equivalentes coerentes com o momento do dia. */
  timing: MealTiming;
  onPick: (foodId: string) => void;
  onSetGrams: (grams: number) => void;
}

/**
 * Painel de troca: equivalentes inteligentes, busca livre por nome de qualquer
 * alimento e quantidade digitável — o treinador escolhe o alimento e a porção
 * exata que quiser (Food Intelligence Engine).
 */
function SwapPanel({ item, foods, restrictions, timing, onPick, onSetGrams }: SwapPanelProps) {
  const [query, setQuery] = React.useState("");

  const equivalents = React.useMemo(
    () => findFoodSwaps(item, foods, restrictions, timing),
    [item, foods, restrictions, timing],
  );

  // Busca livre: qualquer alimento do mesmo papel, com a porção sugerida.
  const searchResults = React.useMemo(() => {
    const q = query.trim();
    if (!q) return null;
    const allowed = buildDietaryFilter(restrictions);
    return foods
      .filter(allowed)
      .filter(
        (f) => f.id !== item.foodId && classifyRole(f) === item.role && matchesQuery(f, q),
      )
      .slice(0, 8)
      .map((f) => ({ food: f, item: buildSwapItem(f, item.role, item) }));
  }, [query, foods, restrictions, item]);

  const list = searchResults ?? equivalents;

  return (
    <div className="flex flex-col gap-2">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar qualquer alimento pelo nome..."
        className="h-8"
      />

      {list.length === 0 ? (
        <p className="px-2 py-1.5 text-xs text-muted-foreground">
          {query.trim() ? "Nenhum alimento encontrado." : "Sem equivalente compatível."}
        </p>
      ) : (
        <div className="flex max-h-64 flex-col gap-1 overflow-y-auto rounded-lg bg-muted/40 p-1.5">
          {list.map(({ food, item: repl }) => (
            <button
              key={food.id}
              type="button"
              onClick={() => onPick(food.id)}
              className="flex flex-col gap-1 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-background"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium">{food.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {repl.grams} g · {repl.kcal} kcal
                </span>
              </div>
              <FoodAttrs food={food} />
            </button>
          ))}
        </div>
      )}

      {/* Quantidade manual — o treinador digita as gramas exatas deste alimento. */}
      <div className="flex items-center gap-2 px-1">
        <label className="text-xs text-muted-foreground">Quantidade</label>
        <Input
          key={item.foodId}
          type="number"
          inputMode="numeric"
          min={1}
          defaultValue={item.grams}
          onChange={(e) => {
            const g = Number(e.target.value);
            if (Number.isFinite(g) && g > 0) onSetGrams(Math.round(g));
          }}
          className="h-8 w-24"
        />
        <span className="text-xs text-muted-foreground">
          g{item.portionLabel ? ` · ${item.portionLabel}` : ""}
        </span>
      </div>
    </div>
  );
}

interface MealCardProps {
  meal: PlannedMeal;
  objective?: string;
  /** Banco de alimentos — habilita a troca inteligente quando presente. */
  foods?: Food[];
  restrictions?: string[];
  /** Chaves `${slot}:${role}` atualmente trocadas (para "voltar ao original"). */
  swappedKeys?: Set<string>;
  onSwap?: (slot: MealSlot, role: FoodRole, foodId: string) => void;
  onSetGrams?: (slot: MealSlot, role: FoodRole, grams: number) => void;
  onReset?: (slot: MealSlot, role: FoodRole) => void;
}

/** Uma refeição do cardápio: objetivo, alvo, itens (com troca inteligente) e total. */
export function MealCard({
  meal,
  objective,
  foods,
  restrictions = [],
  swappedKeys,
  onSwap,
  onSetGrams,
  onReset,
}: MealCardProps) {
  const [openRole, setOpenRole] = React.useState<FoodRole | null>(null);
  const canSwap = Boolean(foods && onSwap);

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-row items-start justify-between gap-2 border-b px-4 py-3">
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{meal.title}</span>
          {objective ? <span className="text-xs text-gold">{objective}</span> : null}
          <span className="text-xs text-muted-foreground">
            Alvo {meal.target.kcal} kcal · P{meal.target.protein} C{meal.target.carbs} G
            {meal.target.fat}
          </span>
        </div>
        <Badge variant="secondary" className="tabular-nums">
          {meal.totals.kcal} kcal
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col px-4 py-1">
        {meal.items.length === 0 ? (
          <p className="py-3 text-sm text-muted-foreground">
            Sem alimento compatível para esta refeição.
          </p>
        ) : (
          meal.items.map((item) => {
            const key = `${meal.slot}:${item.role}`;
            const isOpen = openRole === item.role;
            const isSwapped = swappedKeys?.has(key);
            return (
              <div key={item.role} className="border-b py-2 last:border-b-0">
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-block size-2 shrink-0 rounded-full ${ROLE_DOT[item.role]}`}
                    aria-hidden
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">
                      {item.foodName}
                      {isSwapped ? (
                        <span className="ml-1.5 text-[10px] font-medium text-gold uppercase">
                          trocado
                        </span>
                      ) : null}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.grams} g{item.portionLabel ? ` · ${item.portionLabel}` : ""} ·{" "}
                      {ROLE_LABELS[item.role]}
                    </span>
                  </div>
                  <div className="shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                    <div className="text-sm font-medium text-foreground">{item.kcal} kcal</div>
                    <div>
                      P{item.protein} · C{item.carbs} · G{item.fat}
                    </div>
                  </div>
                  {canSwap ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={() => setOpenRole(isOpen ? null : item.role)}
                    >
                      <RepeatIcon className="size-3.5" />
                      Trocar
                    </Button>
                  ) : null}
                </div>

                {canSwap && isOpen ? (
                  <div className="mt-2 flex flex-col gap-1.5 pl-5">
                    {isSwapped ? (
                      <button
                        type="button"
                        onClick={() => {
                          onReset?.(meal.slot, item.role);
                          setOpenRole(null);
                        }}
                        className={cn(
                          "flex items-center gap-1.5 self-start rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted",
                        )}
                      >
                        <RotateCcwIcon className="size-3.5" />
                        Voltar ao original
                      </button>
                    ) : null}
                    <SwapPanel
                      item={item}
                      foods={foods!}
                      restrictions={restrictions}
                      timing={meal.timing}
                      onPick={(foodId) => onSwap?.(meal.slot, item.role, foodId)}
                      onSetGrams={(grams) => onSetGrams?.(meal.slot, item.role, grams)}
                    />
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
