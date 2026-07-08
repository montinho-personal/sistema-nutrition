"use client";

import * as React from "react";
import {
  BackpackIcon,
  BadgeDollarSignIcon,
  ClockIcon,
  HandPlatterIcon,
  PlusIcon,
  RepeatIcon,
  RotateCcwIcon,
  Trash2Icon,
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
import type { FoodRole, MealEntry, MealItem, MealSlot, PlannedMeal } from "@/modules/meal-plan/types";

export type { MealEntry };

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

/** Painel de adicionar alimento: busca livre por nome, de qualquer papel. */
function AddFoodPanel({
  foods,
  restrictions,
  onAdd,
}: {
  foods: Food[];
  restrictions: string[];
  onAdd: (foodId: string) => void;
}) {
  const [query, setQuery] = React.useState("");
  const results = React.useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    const allowed = buildDietaryFilter(restrictions);
    return foods
      .filter(allowed)
      .filter((f) => matchesQuery(f, q))
      .slice(0, 8);
  }, [query, foods, restrictions]);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed p-2">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar alimento para adicionar..."
        className="h-8"
        autoFocus
      />
      {query.trim() && results.length === 0 ? (
        <p className="px-1 text-xs text-muted-foreground">Nenhum alimento encontrado.</p>
      ) : results.length > 0 ? (
        <div className="flex max-h-56 flex-col gap-1 overflow-y-auto">
          {results.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onAdd(f.id)}
              className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
            >
              <span className="font-medium">{f.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {ROLE_LABELS[classifyRole(f)]}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface MealCardProps {
  meal: PlannedMeal;
  objective?: string;
  /** Banco de alimentos — habilita troca e adição quando presente. */
  foods?: Food[];
  restrictions?: string[];
  /** Itens exibidos com chave estável (modo edição). Ausente = usa meal.items (leitura). */
  entries?: MealEntry[];
  /** Itens-base removidos, para restaurar. */
  removedBase?: { key: string; foodName: string }[];
  /** Chaves com troca aplicada (badge "trocado"). */
  swappedKeys?: Set<string>;
  onSwap?: (key: string, foodId: string) => void;
  onSetGrams?: (key: string, grams: number) => void;
  onReset?: (key: string) => void;
  onRemove?: (key: string) => void;
  onRestore?: (key: string) => void;
  onAddFood?: (slot: MealSlot, foodId: string) => void;
}

/** Uma refeição do cardápio: objetivo, alvo, itens (trocar, quantidade, remover,
 * adicionar) e total. Sem callbacks de edição, é somente-leitura (relatório). */
export function MealCard({
  meal,
  objective,
  foods,
  restrictions = [],
  entries,
  removedBase = [],
  swappedKeys,
  onSwap,
  onSetGrams,
  onReset,
  onRemove,
  onRestore,
  onAddFood,
}: MealCardProps) {
  const [openKey, setOpenKey] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);

  const list: MealEntry[] =
    entries ?? meal.items.map((it) => ({ key: `${meal.slot}:${it.role}`, item: it, base: true }));
  const canSwap = Boolean(foods && onSwap);
  const canRemove = Boolean(onRemove);
  const canAdd = Boolean(foods && onAddFood);

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
        {list.length === 0 ? (
          <p className="py-3 text-sm text-muted-foreground">
            Sem alimento nesta refeição.
          </p>
        ) : (
          list.map(({ key, item }) => {
            const isOpen = openKey === key;
            const isSwapped = swappedKeys?.has(key);
            return (
              <div key={key} className="border-b py-2 last:border-b-0">
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
                      onClick={() => setOpenKey(isOpen ? null : key)}
                    >
                      <RepeatIcon className="size-3.5" />
                      Trocar
                    </Button>
                  ) : null}
                  {canRemove ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 text-muted-foreground hover:text-danger"
                      title="Remover do cardápio"
                      onClick={() => {
                        onRemove?.(key);
                        if (isOpen) setOpenKey(null);
                      }}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  ) : null}
                </div>

                {canSwap && isOpen ? (
                  <div className="mt-2 flex flex-col gap-1.5 pl-5">
                    {isSwapped ? (
                      <button
                        type="button"
                        onClick={() => {
                          onReset?.(key);
                          setOpenKey(null);
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
                      onPick={(foodId) => onSwap?.(key, foodId)}
                      onSetGrams={(grams) => onSetGrams?.(key, grams)}
                    />
                  </div>
                ) : null}
              </div>
            );
          })
        )}

        {canAdd || removedBase.length > 0 ? (
          <div className="flex flex-col gap-2 py-2.5">
            {removedBase.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Removidos:</span>
                {removedBase.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => onRestore?.(r.key)}
                    className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted"
                  >
                    <RotateCcwIcon className="size-3" />
                    {r.foodName}
                  </button>
                ))}
              </div>
            ) : null}
            {canAdd ? (
              adding ? (
                <AddFoodPanel
                  foods={foods!}
                  restrictions={restrictions}
                  onAdd={(foodId) => {
                    onAddFood?.(meal.slot, foodId);
                    setAdding(false);
                  }}
                />
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="self-start text-muted-foreground"
                  onClick={() => setAdding(true)}
                >
                  <PlusIcon className="size-4" />
                  Adicionar alimento
                </Button>
              )
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
