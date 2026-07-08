"use client";

import * as React from "react";
import {
  AlertOctagonIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  BrainIcon,
  InfoIcon,
  SparklesIcon,
} from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { ROLE_LABELS } from "@/modules/meal-plan/constants/parameters";
import {
  buildReplacementComparison,
  classifyRole,
  rankReplacementCandidates,
} from "@/modules/meal-plan/services";
import { buildDietaryFilter } from "@/modules/meal-plan/services/dietaryFilters";
import { matchesQuery } from "@/modules/foods/services";
import type { Food, MealTiming } from "@/modules/foods/types";
import type { StudentGoal } from "@/modules/students/types";
import type {
  MacroTotals,
  MealItem,
  ReplacementCandidate,
  ReplacementComparison,
  ReplacementMode,
  ReplacementWarningLevel,
} from "@/modules/meal-plan/types";

const MODE_OPTIONS: { value: ReplacementMode; label: string; description: string }[] = [
  {
    value: "smart",
    label: "Recomendação inteligente",
    description: "O Nutrition Decision Engine calcula a quantidade ideal para a sua estratégia.",
  },
  {
    value: "match_calories",
    label: "Manter calorias",
    description: "Ajusta a quantidade para manter as calorias da refeição.",
  },
  {
    value: "match_protein",
    label: "Manter proteína",
    description: "Ajusta a quantidade para manter a proteína da refeição.",
  },
  {
    value: "match_quantity",
    label: "Manter quantidade",
    description: "Mesma quantidade em gramas do alimento original.",
  },
];

const WARNING_STYLE: Record<
  ReplacementWarningLevel,
  { icon: React.ElementType; className: string; label: string }
> = {
  info: { icon: InfoIcon, className: "border-border bg-muted/40 text-muted-foreground", label: "Info" },
  attention: {
    icon: AlertTriangleIcon,
    className: "border-warning/40 bg-warning/5 text-foreground",
    label: "Atenção",
  },
  high_impact: {
    icon: AlertOctagonIcon,
    className: "border-danger/40 bg-danger/5 text-foreground",
    label: "Alto impacto",
  },
};

const shortName = (name: string) => name.split(",")[0];

function formatDelta(value: number, unit: string): string {
  const rounded = Math.round(value);
  if (rounded === 0) return `0 ${unit}`;
  return `${rounded > 0 ? "+" : ""}${rounded} ${unit}`;
}

/** Linha "métrica: antes → depois (delta)" da comparação. */
function DeltaRow({ label, before, after, unit }: { label: string; before: number; after: number; unit: string }) {
  const delta = after - before;
  const isWorse = unit === "kcal" || unit === "g gordura" ? delta > 0 : false;
  return (
    <div className="flex items-center justify-between gap-2 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5 tabular-nums">
        <span>{Math.round(before)}</span>
        <ArrowRightIcon className="size-3 text-muted-foreground" />
        <span className="font-medium text-foreground">{Math.round(after)}</span>
        {delta !== 0 ? (
          <span className={cn("text-xs", isWorse ? "text-danger" : "text-muted-foreground")}>
            ({formatDelta(delta, unit)})
          </span>
        ) : null}
      </span>
    </div>
  );
}

interface SubstitutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalFood: Food;
  originalItem: MealItem;
  foods: Food[];
  restrictions: string[];
  timing: MealTiming;
  goal: StudentGoal;
  mealTotals: MacroTotals;
  dayTotals: MacroTotals;
  dayTarget: MacroTotals;
  onConfirm: (comparison: ReplacementComparison) => void;
}

/**
 * Modal do Motor Inteligente de Substituição Alimentar: o treinador escolhe o
 * modo de equivalência, vê o ranking contextual de substitutos, a comparação
 * antes/depois (item, refeição e dia) e a decisão explicada do Nutrition
 * Decision Engine — tudo calculado por `foodSubstitution.ts` (determinístico,
 * a interface só exibe).
 */
export function SubstitutionDialog({
  open,
  onOpenChange,
  originalFood,
  originalItem,
  foods,
  restrictions,
  timing,
  goal,
  mealTotals,
  dayTotals,
  dayTarget,
  onConfirm,
}: SubstitutionDialogProps) {
  // O diálogo só existe na árvore enquanto aberto (montagem condicional no
  // MealCard) — o estado já nasce zerado a cada troca, sem precisar de efeito.
  const [mode, setMode] = React.useState<ReplacementMode>("smart");
  const [query, setQuery] = React.useState("");
  const [selectedFoodId, setSelectedFoodId] = React.useState<string | null>(null);
  const [manualGrams, setManualGrams] = React.useState("");

  const candidates = React.useMemo<ReplacementCandidate[]>(
    () =>
      rankReplacementCandidates({
        originalFood,
        originalItem,
        foods,
        restrictions,
        timing,
        goal,
        dayTotals,
        dayTarget,
      }),
    [originalFood, originalItem, foods, restrictions, timing, goal, dayTotals, dayTarget],
  );

  const searchResults = React.useMemo(() => {
    const q = query.trim();
    if (!q) return null;
    const allowed = buildDietaryFilter(restrictions);
    return foods
      .filter(allowed)
      .filter((f) => f.id !== originalFood.id && classifyRole(f) === originalItem.role && matchesQuery(f, q))
      .slice(0, 10);
  }, [query, foods, restrictions, originalFood, originalItem]);

  const list = searchResults ?? candidates.map((c) => c.food);
  const candidateScoreById = React.useMemo(
    () => new Map(candidates.map((c) => [c.food.id, c])),
    [candidates],
  );

  const selectedFood = React.useMemo(
    () => foods.find((f) => f.id === selectedFoodId) ?? null,
    [foods, selectedFoodId],
  );

  const manualGramsValue = React.useMemo(() => {
    const n = Number(manualGrams);
    return manualGrams.trim() && Number.isFinite(n) && n > 0 ? n : undefined;
  }, [manualGrams]);

  const comparison = React.useMemo<ReplacementComparison | null>(() => {
    if (!selectedFood) return null;
    return buildReplacementComparison({
      originalFood,
      originalItem,
      replacementFood: selectedFood,
      mode,
      mealTotals,
      dayTotals,
      dayTarget,
      goal,
      manualGrams: manualGramsValue,
    });
  }, [selectedFood, originalFood, originalItem, mode, mealTotals, dayTotals, dayTarget, goal, manualGramsValue]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-4 overflow-hidden sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Trocar alimento</DialogTitle>
          <DialogDescription>
            Atual: {originalItem.grams} g de {originalFood.name} · {ROLE_LABELS[originalItem.role]}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="-mx-1 flex-1 px-1">
          <div className="flex flex-col gap-4 pb-1">
            <RadioGroup
              value={mode}
              onValueChange={(v) => setMode(v as ReplacementMode)}
              className="grid grid-cols-1 gap-2 sm:grid-cols-2"
            >
              {MODE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  htmlFor={`mode-${opt.value}`}
                  className={cn(
                    "flex cursor-pointer flex-col gap-0.5 rounded-lg border p-2.5 text-left transition-colors",
                    mode === opt.value ? "border-gold bg-gold/5" : "hover:bg-muted/50",
                  )}
                >
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <RadioGroupItem value={opt.value} id={`mode-${opt.value}`} />
                    {opt.label}
                    {opt.value === "smart" ? <SparklesIcon className="size-3.5 text-gold" /> : null}
                  </span>
                  <span className="pl-[22px] text-xs text-muted-foreground">{opt.description}</span>
                </label>
              ))}
            </RadioGroup>

            <div className="flex flex-col gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar qualquer alimento pelo nome..."
                className="h-9"
              />
              {list.length === 0 ? (
                <p className="px-2 py-1.5 text-xs text-muted-foreground">
                  {query.trim() ? "Nenhum alimento encontrado." : "Sem substituto compatível."}
                </p>
              ) : (
                <div className="flex max-h-52 flex-col gap-1 overflow-y-auto rounded-lg bg-muted/40 p-1.5">
                  {list.map((food) => {
                    const candidate = candidateScoreById.get(food.id);
                    const isSelected = selectedFoodId === food.id;
                    return (
                      <button
                        key={food.id}
                        type="button"
                        onClick={() => setSelectedFoodId(food.id)}
                        className={cn(
                          "flex flex-col gap-1 rounded-md px-2.5 py-2 text-left transition-colors",
                          isSelected ? "bg-gold/10 ring-1 ring-gold/40" : "hover:bg-background",
                        )}
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-medium">{food.name}</span>
                          {candidate === candidates[0] ? (
                            <Badge variant="secondary" className="shrink-0 text-[10px] text-gold">
                              Recomendado
                            </Badge>
                          ) : null}
                        </div>
                        {candidate && candidate.reasons.length > 0 ? (
                          <span className="text-[11px] text-muted-foreground">
                            {candidate.reasons.join(" · ")}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {comparison ? (
              <div className="flex flex-col gap-4">
                <div className="rounded-lg border p-3">
                  <div className="mb-1 flex items-center justify-between text-sm font-medium">
                    <span>
                      {comparison.replacementItem.grams} g de {shortName(comparison.replacementFood.name)}
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                      no lugar de {comparison.originalItem.grams} g
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pb-2">
                    <Label htmlFor="manual-grams" className="text-xs text-muted-foreground">
                      Ajustar manualmente
                    </Label>
                    <Input
                      id="manual-grams"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      placeholder={String(comparison.replacementItem.grams)}
                      value={manualGrams}
                      onChange={(e) => setManualGrams(e.target.value)}
                      className="h-7 w-20"
                    />
                    <span className="text-xs text-muted-foreground">g</span>
                  </div>
                  <div className="divide-y">
                    <DeltaRow
                      label="Calorias"
                      before={comparison.originalItem.kcal}
                      after={comparison.replacementItem.kcal}
                      unit="kcal"
                    />
                    <DeltaRow
                      label="Proteína"
                      before={comparison.originalItem.protein}
                      after={comparison.replacementItem.protein}
                      unit="g proteína"
                    />
                    <DeltaRow
                      label="Carboidrato"
                      before={comparison.originalItem.carbs}
                      after={comparison.replacementItem.carbs}
                      unit="g carbo"
                    />
                    <DeltaRow
                      label="Gordura"
                      before={comparison.originalItem.fat}
                      after={comparison.replacementItem.fat}
                      unit="g gordura"
                    />
                  </div>
                </div>

                <div className="rounded-lg border p-3">
                  <span className="mb-1 block text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Impacto no dia
                  </span>
                  <div className="divide-y">
                    <DeltaRow
                      label={`Calorias (alvo ${comparison.dayTarget.kcal})`}
                      before={comparison.dayBefore.kcal}
                      after={comparison.dayAfter.kcal}
                      unit="kcal"
                    />
                    <DeltaRow
                      label={`Proteína (alvo ${comparison.dayTarget.protein})`}
                      before={comparison.dayBefore.protein}
                      after={comparison.dayAfter.protein}
                      unit="g proteína"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 rounded-lg border border-gold/30 bg-gold/5 p-3">
                  <span className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-gold uppercase">
                    <BrainIcon className="size-3.5" />
                    Nutrition Decision Engine
                  </span>
                  <p className="text-sm font-medium">{comparison.decision.headline}</p>
                  <p className="text-sm text-muted-foreground">{comparison.decision.justification}</p>
                  {comparison.decision.risk ? (
                    <p className="text-sm text-foreground">
                      <span className="font-medium">Risco: </span>
                      {comparison.decision.risk}
                    </p>
                  ) : null}
                  {comparison.decision.alternative ? (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Alternativa: </span>
                      {comparison.decision.alternative}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-1.5">
                  {comparison.warnings.map((w, i) => {
                    const style = WARNING_STYLE[w.level];
                    const Icon = style.icon;
                    return (
                      <div
                        key={i}
                        className={cn("flex items-start gap-2 rounded-lg border px-3 py-2 text-xs", style.className)}
                      >
                        <Icon className="mt-0.5 size-3.5 shrink-0" />
                        {w.message}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                Escolha um alimento acima para ver a comparação.
              </p>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={!comparison} onClick={() => comparison && onConfirm(comparison)}>
            Confirmar troca
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
