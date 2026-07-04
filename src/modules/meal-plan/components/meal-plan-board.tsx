"use client";

import * as React from "react";
import Link from "next/link";
import { RefreshCwIcon, TargetIcon } from "lucide-react";
import { toast } from "sonner";

import { isAiEnabled } from "@/config/env";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { EmptyState } from "@/shared/components/empty-state";
import { LoadingScreen } from "@/shared/components/loading-screen";
import { SectionHeader } from "@/shared/components/section-header";
import { MetricCard } from "@/shared/components/metric-card";
import { curatedFoods } from "@/modules/foods/data/curatedFoods";
import {
  buildItemWithGrams,
  buildSwapItem,
  classifyRole,
  parseDirective,
  sumItems,
} from "@/modules/meal-plan/services";
import { interpretMealInstructionAction } from "@/modules/meal-plan/services/interpretMealInstruction.action";
import { MEAL_OBJECTIVES } from "@/modules/meal-plan/constants/parameters";
import { useStudentPlan } from "@/modules/meal-plan/hooks/use-student-plan";
import { useNutritionistOpinion } from "@/modules/meal-plan/hooks/use-nutritionist-opinion";
import { MealCard, type MealEntry } from "@/modules/meal-plan/components/meal-card";
import { MealInstruction } from "@/modules/meal-plan/components/meal-instruction";
import { NutritionistOpinion } from "@/modules/meal-plan/components/nutritionist-opinion";
import type { MealPlan, MealSlot, PlannedMeal } from "@/modules/meal-plan/types";

const foodById = new Map(curatedFoods.map((f) => [f.id, f]));
const pct = (value: number, target: number) => (target > 0 ? Math.round((value / target) * 100) : 0);

/**
 * O cardápio do dia com troca inteligente (Workflow V1 — Etapa 5): objetivo por
 * refeição, opções equivalentes por alimento (Food Intelligence) e recálculo
 * automático a cada troca. Reaproveitado pela tela do Plano e pela Etapa 5.
 */
export function MealPlanBoard({ studentId }: { studentId: string }) {
  const { plan: basePlan, restrictions, input, nextVariant, instruction, directive, setInstruction } =
    useStudentPlan(studentId);
  const opinion = useNutritionistOpinion(studentId);
  // Edições do treinador por item (chave `${slot}:${role}` para itens-base;
  // `x:${slot}:${id}` para adicionados): troca (foodId), quantidade manual
  // (grams != null), remoção (removed) e alimentos adicionados (extras).
  const [overrides, setOverrides] = React.useState<
    Record<string, { foodId: string; grams: number | null }>
  >({});
  const [removed, setRemoved] = React.useState<Record<string, boolean>>({});
  const [extras, setExtras] = React.useState<
    Record<string, { id: string; foodId: string; grams: number }[]>
  >({});
  const nextId = React.useRef(0);
  const [applying, setApplying] = React.useState(false);

  const resetEdits = () => {
    setOverrides({});
    setRemoved({});
    setExtras({});
  };

  // Nova instrução recomeça do cardápio limpo (sem trocas manuais residuais). A
  // interpretação é determinística; com IA habilitada, ela enriquece o que o
  // texto esconde (degradando com elegância a qualquer falha).
  const applyInstruction = async (text: string) => {
    resetEdits();
    if (!text.trim()) {
      setInstruction("", null);
      return;
    }
    if (!isAiEnabled) {
      setInstruction(text, parseDirective(text));
      return;
    }
    setApplying(true);
    try {
      const res = await interpretMealInstructionAction(text);
      setInstruction(text, res.directive);
      if (res.status === "error") {
        toast.error("A IA não respondeu — apliquei o que entendi diretamente.");
      } else if (res.directive.unsupported.length > 0) {
        toast.info(`Ainda não sei aplicar: ${res.directive.unsupported.join(", ")}.`);
      }
    } finally {
      setApplying(false);
    }
  };

  // Aplica todas as edições do treinador (troca, quantidade, remoção, adição) e
  // recalcula totais/aderência. Cada refeição carrega suas `entries` (com chave
  // estável) e os itens-base removidos (para restaurar).
  type DisplayMeal = PlannedMeal & {
    entries: MealEntry[];
    removedBase: { key: string; foodName: string }[];
  };
  type DisplayPlan = Omit<MealPlan, "meals"> & { meals: DisplayMeal[] };
  const plan = React.useMemo<DisplayPlan | null>(() => {
    if (!basePlan) return null;
    const meals: DisplayMeal[] = basePlan.meals.map((meal) => {
      const baseEntries: MealEntry[] = meal.items
        .filter((it) => !removed[`${meal.slot}:${it.role}`])
        .map((it) => {
          const key = `${meal.slot}:${it.role}`;
          const ov = overrides[key];
          let display = it;
          const food = ov ? foodById.get(ov.foodId) : undefined;
          if (ov && food) {
            display =
              ov.grams != null
                ? buildItemWithGrams(food, it.role, ov.grams)
                : buildSwapItem(food, it.role, it);
          }
          return { key, item: display, base: true };
        });
      const addedEntries: MealEntry[] = (extras[meal.slot] ?? []).flatMap((a) => {
        const food = foodById.get(a.foodId);
        if (!food) return [];
        return [
          {
            key: `x:${meal.slot}:${a.id}`,
            item: buildItemWithGrams(food, classifyRole(food), a.grams),
            base: false,
          },
        ];
      });
      const entries = [...baseEntries, ...addedEntries];
      const items = entries.map((e) => e.item);
      const removedBase = meal.items
        .filter((it) => removed[`${meal.slot}:${it.role}`])
        .map((it) => ({ key: `${meal.slot}:${it.role}`, foodName: it.foodName }));
      return { ...meal, items, totals: sumItems(items), entries, removedBase };
    });
    const totals = meals.reduce(
      (acc, m) => ({
        kcal: acc.kcal + m.totals.kcal,
        protein: acc.protein + m.totals.protein,
        carbs: acc.carbs + m.totals.carbs,
        fat: acc.fat + m.totals.fat,
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    );
    const t = basePlan.target;
    return {
      ...basePlan,
      meals,
      totals,
      accuracy: {
        kcal: pct(totals.kcal, t.kcal),
        protein: pct(totals.protein, t.protein),
        carbs: pct(totals.carbs, t.carbs),
        fat: pct(totals.fat, t.fat),
      },
    };
  }, [basePlan, overrides, removed, extras]);

  const swappedKeys = React.useMemo(() => new Set(Object.keys(overrides)), [overrides]);

  const isExtra = (key: string) => key.startsWith("x:");
  const extraSlot = (key: string) => key.split(":")[1] as MealSlot;
  const extraId = (key: string) => key.split(":")[2];

  // Trocar o alimento — porção automática (preserva a contribuição do papel).
  const onSwap = (key: string, foodId: string) => {
    if (isExtra(key)) {
      const slot = extraSlot(key);
      const id = extraId(key);
      const food = foodById.get(foodId);
      setExtras((prev) => ({
        ...prev,
        [slot]: (prev[slot] ?? []).map((a) =>
          a.id === id
            ? { ...a, foodId, grams: food?.portions[0]?.grams ?? a.grams }
            : a,
        ),
      }));
      return;
    }
    setOverrides((prev) => ({ ...prev, [key]: { foodId, grams: null } }));
  };
  // Fixar a quantidade em gramas — mantém o alimento atual (ou o original).
  const onSetGrams = (key: string, grams: number) => {
    if (isExtra(key)) {
      const slot = extraSlot(key);
      const id = extraId(key);
      setExtras((prev) => ({
        ...prev,
        [slot]: (prev[slot] ?? []).map((a) => (a.id === id ? { ...a, grams } : a)),
      }));
      return;
    }
    setOverrides((prev) => {
      const [slot, role] = key.split(":");
      const baseId = basePlan?.meals
        .find((m) => m.slot === slot)
        ?.items.find((i) => i.role === role)?.foodId;
      const foodId = prev[key]?.foodId ?? baseId;
      if (!foodId) return prev;
      return { ...prev, [key]: { foodId, grams } };
    });
  };
  const onReset = (key: string) =>
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  const onRemove = (key: string) => {
    if (isExtra(key)) {
      const slot = extraSlot(key);
      const id = extraId(key);
      setExtras((prev) => ({ ...prev, [slot]: (prev[slot] ?? []).filter((a) => a.id !== id) }));
      return;
    }
    setRemoved((prev) => ({ ...prev, [key]: true }));
    onReset(key);
  };
  const onRestore = (key: string) =>
    setRemoved((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  const onAddFood = (slot: MealSlot, foodId: string) => {
    const food = foodById.get(foodId);
    if (!food) return;
    const grams = food.portions[0]?.grams ?? 100;
    const id = String(++nextId.current);
    setExtras((prev) => ({ ...prev, [slot]: [...(prev[slot] ?? []), { id, foodId, grams }] }));
  };
  const regenerate = () => {
    resetEdits();
    nextVariant();
  };

  if (typeof window === "undefined") {
    return <LoadingScreen messages={["Montando o cardápio..."]} />;
  }

  if (!plan) {
    return (
      <EmptyState
        icon={<TargetIcon />}
        title={!input ? "Defina a estratégia primeiro" : "Conclua o diagnóstico primeiro"}
        description="A dieta é consequência das decisões estratégicas. Gere a Estratégia e os Macros deste aluno para montar o cardápio."
        action={
          <Button asChild>
            <Link href={`/strategy/${studentId}`}>Ir para a estratégia</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <MealInstruction
        key={instruction}
        instruction={instruction}
        appliedDirective={directive}
        applying={applying}
        onApply={applyInstruction}
      />

      <section className="flex flex-col gap-3">
        <SectionHeader title="Resumo do dia" description="Total do cardápio ante o alvo dos macros." />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard label="Calorias" value={`${plan.totals.kcal} kcal`} delta={`${plan.accuracy.kcal}% do alvo (${plan.target.kcal})`} />
          <MetricCard label="Proteína" value={`${plan.totals.protein} g`} delta={`${plan.accuracy.protein}% do alvo (${plan.target.protein})`} />
          <MetricCard label="Carboidrato" value={`${plan.totals.carbs} g`} delta={`${plan.accuracy.carbs}% do alvo (${plan.target.carbs})`} />
          <MetricCard label="Gordura" value={`${plan.totals.fat} g`} delta={`${plan.accuracy.fat}% do alvo (${plan.target.fat})`} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <SectionHeader title="Cardápio" description="Toque em Trocar para ver equivalentes — a conta se ajusta sozinha." />
          <Button variant="outline" size="sm" onClick={regenerate}>
            <RefreshCwIcon className="size-4" />
            Gerar outra opção
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {plan.meals.map((meal) => (
            <MealCard
              key={meal.slot}
              meal={meal}
              objective={MEAL_OBJECTIVES[meal.slot]}
              foods={curatedFoods}
              restrictions={restrictions}
              entries={meal.entries}
              removedBase={meal.removedBase}
              swappedKeys={swappedKeys}
              onSwap={onSwap}
              onSetGrams={onSetGrams}
              onReset={onReset}
              onRemove={onRemove}
              onRestore={onRestore}
              onAddFood={onAddFood}
            />
          ))}
        </div>
      </section>

      {opinion ? <NutritionistOpinion opinion={opinion} /> : null}

      <Card>
        <CardContent className="flex flex-col gap-1.5 pt-6 text-sm text-muted-foreground">
          {plan.notes.map((note) => (
            <div key={note} className="flex items-start gap-2">
              <span className="mt-1.5 inline-block size-1 shrink-0 rounded-full bg-gold" />
              {note}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
