"use client";

import * as React from "react";
import {
  CheckIcon,
  ClockIcon,
  PencilIcon,
  PlusIcon,
  RepeatIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";

import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { ROLE_LABELS } from "@/modules/meal-plan/constants/parameters";
import { buildDietaryFilter, classifyRole } from "@/modules/meal-plan/services";
import { SubstitutionDialog } from "@/modules/meal-plan/components/substitution-dialog";
import { matchesQuery } from "@/modules/foods/services";
import type { Food } from "@/modules/foods/types";
import type { StudentGoal } from "@/modules/students/types";
import type {
  FoodRole,
  MacroTotals,
  MealEntry,
  MealSlot,
  PlannedMeal,
  ReplacementComparison,
} from "@/modules/meal-plan/types";

export type { MealEntry };

const ROLE_DOT: Record<FoodRole, string> = {
  protein: "bg-gold",
  carb: "bg-foreground/70",
  legume: "bg-amber-700",
  fat: "bg-muted-foreground/50",
  veg: "bg-success",
};

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
  /** Objetivo do aluno e totais do dia — o Motor de Substituição precisa do contexto completo. */
  goal?: StudentGoal;
  dayTotals?: MacroTotals;
  dayTarget?: MacroTotals;
  onConfirmReplace?: (key: string, comparison: ReplacementComparison) => void;
  onReset?: (key: string) => void;
  onRemove?: (key: string) => void;
  onRestore?: (key: string) => void;
  onAddFood?: (slot: MealSlot, foodId: string) => void;
  /** Ajusta a quantidade (g) de um item diretamente na linha, sem abrir a troca. */
  onSetGrams?: (key: string, grams: number) => void;
  /** Edita nome e horário da refeição (modo edição). */
  onEditMeal?: (slot: MealSlot, patch: { title?: string | null; time?: string | null }) => void;
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
  goal,
  dayTotals,
  dayTarget,
  onConfirmReplace,
  onReset,
  onRemove,
  onRestore,
  onAddFood,
  onEditMeal,
  onSetGrams,
}: MealCardProps) {
  const [openKey, setOpenKey] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [editingHeader, setEditingHeader] = React.useState(false);

  const list: MealEntry[] =
    entries ?? meal.items.map((it) => ({ key: `${meal.slot}:${it.role}`, item: it, base: true }));
  const canSwap = Boolean(foods && goal && dayTotals && dayTarget && onConfirmReplace);
  const canRemove = Boolean(onRemove);
  const canAdd = Boolean(foods && onAddFood);
  const canEditMeal = Boolean(onEditMeal);
  const openEntry = canSwap ? list.find((e) => e.key === openKey) : undefined;
  const openFood = openEntry ? foods?.find((f) => f.id === openEntry.item.foodId) : undefined;

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-row items-start justify-between gap-2 border-b px-4 py-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          {canEditMeal && editingHeader ? (
            <div className="flex flex-wrap items-center gap-1.5 py-0.5">
              <Input
                defaultValue={meal.title}
                aria-label="Nome da refeição"
                className="h-8 w-40"
                autoFocus
                onChange={(e) => onEditMeal?.(meal.slot, { title: e.target.value })}
              />
              <Input
                type="time"
                defaultValue={meal.time ?? ""}
                aria-label="Horário da refeição"
                className="h-8 w-28"
                onChange={(e) => onEditMeal?.(meal.slot, { time: e.target.value })}
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                title="Concluir edição"
                onClick={() => setEditingHeader(false)}
              >
                <CheckIcon className="size-4" />
              </Button>
            </div>
          ) : (
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              <span className="truncate">{meal.title}</span>
              {meal.time ? (
                <span className="flex shrink-0 items-center gap-1 text-xs font-normal text-muted-foreground">
                  <ClockIcon className="size-3" />
                  {meal.time}
                </span>
              ) : null}
              {canEditMeal ? (
                <button
                  type="button"
                  title="Editar nome e horário"
                  onClick={() => setEditingHeader(true)}
                  className="shrink-0 rounded p-0.5 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                >
                  <PencilIcon className="size-3" />
                </button>
              ) : null}
            </span>
          )}
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
                  </div>
                  <div className="shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                    <div className="text-sm font-medium text-foreground">{item.kcal} kcal</div>
                    <div>
                      P{item.protein} · C{item.carbs} · G{item.fat}
                    </div>
                  </div>
                  {isSwapped ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 text-muted-foreground"
                      title="Voltar ao original"
                      onClick={() => onReset?.(key)}
                    >
                      <RotateCcwIcon className="size-4" />
                    </Button>
                  ) : null}
                  {canSwap ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={() => setOpenKey(key)}
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
                      onClick={() => onRemove?.(key)}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  ) : null}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1 pl-5 text-xs text-muted-foreground">
                  {onSetGrams ? (
                    <span className="flex items-center gap-0.5">
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        defaultValue={item.grams}
                        key={`${key}:${item.grams}`}
                        aria-label={`Quantidade de ${item.foodName} em gramas`}
                        className="h-6 w-16 px-1.5 text-right text-xs tabular-nums"
                        onBlur={(e) => {
                          const grams = Math.round(Number(e.target.value));
                          if (Number.isFinite(grams) && grams > 0 && grams !== item.grams) {
                            onSetGrams(key, grams);
                          } else {
                            e.target.value = String(item.grams);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur();
                        }}
                      />
                      g
                    </span>
                  ) : (
                    <span>{item.grams} g</span>
                  )}
                  {item.portionLabel ? <span>· {item.portionLabel}</span> : null}
                  <span>· {ROLE_LABELS[item.role]}</span>
                </div>
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

      {canSwap && openEntry && openFood && goal && dayTotals && dayTarget ? (
        <SubstitutionDialog
          open
          onOpenChange={(o) => setOpenKey(o ? openKey : null)}
          originalFood={openFood}
          originalItem={openEntry.item}
          foods={foods!}
          restrictions={restrictions}
          timing={meal.timing}
          goal={goal}
          mealTotals={meal.totals}
          dayTotals={dayTotals}
          dayTarget={dayTarget}
          onConfirm={(comparison) => {
            onConfirmReplace?.(openEntry.key, comparison);
            setOpenKey(null);
          }}
        />
      ) : null}
    </Card>
  );
}
