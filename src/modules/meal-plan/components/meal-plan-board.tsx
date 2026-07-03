"use client";

import * as React from "react";
import Link from "next/link";
import { RefreshCwIcon, TargetIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { EmptyState } from "@/shared/components/empty-state";
import { LoadingScreen } from "@/shared/components/loading-screen";
import { SectionHeader } from "@/shared/components/section-header";
import { MetricCard } from "@/shared/components/metric-card";
import { curatedFoods } from "@/modules/foods/data/curatedFoods";
import { buildSwapItem, sumItems } from "@/modules/meal-plan/services";
import { MEAL_OBJECTIVES } from "@/modules/meal-plan/constants/parameters";
import { useStudentPlan } from "@/modules/meal-plan/hooks/use-student-plan";
import { MealCard } from "@/modules/meal-plan/components/meal-card";
import { MealInstruction } from "@/modules/meal-plan/components/meal-instruction";
import type { FoodRole, MealPlan, MealSlot } from "@/modules/meal-plan/types";

const foodById = new Map(curatedFoods.map((f) => [f.id, f]));
const pct = (value: number, target: number) => (target > 0 ? Math.round((value / target) * 100) : 0);

/**
 * O cardápio do dia com troca inteligente (Workflow V1 — Etapa 5): objetivo por
 * refeição, opções equivalentes por alimento (Food Intelligence) e recálculo
 * automático a cada troca. Reaproveitado pela tela do Plano e pela Etapa 5.
 */
export function MealPlanBoard({ studentId }: { studentId: string }) {
  const { plan: basePlan, restrictions, input, nextVariant, instruction, setInstruction } =
    useStudentPlan(studentId);
  const [swaps, setSwaps] = React.useState<Record<string, string>>({});

  // Nova instrução recomeça do cardápio limpo (sem trocas manuais residuais).
  const applyInstruction = (text: string) => {
    setSwaps({});
    setInstruction(text);
  };

  // Aplica as trocas do profissional e recalcula totais/aderência.
  const plan = React.useMemo<MealPlan | null>(() => {
    if (!basePlan) return null;
    const meals = basePlan.meals.map((meal) => {
      const items = meal.items.map((item) => {
        const food = foodById.get(swaps[`${meal.slot}:${item.role}`] ?? "");
        return food ? buildSwapItem(food, item.role, item) : item;
      });
      return { ...meal, items, totals: sumItems(items) };
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
  }, [basePlan, swaps]);

  const swappedKeys = React.useMemo(() => new Set(Object.keys(swaps)), [swaps]);

  const onSwap = (slot: MealSlot, role: FoodRole, foodId: string) =>
    setSwaps((prev) => ({ ...prev, [`${slot}:${role}`]: foodId }));
  const onReset = (slot: MealSlot, role: FoodRole) =>
    setSwaps((prev) => {
      const nextSwaps = { ...prev };
      delete nextSwaps[`${slot}:${role}`];
      return nextSwaps;
    });
  const regenerate = () => {
    setSwaps({});
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
      <MealInstruction key={instruction} instruction={instruction} onApply={applyInstruction} />

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
              swappedKeys={swappedKeys}
              onSwap={onSwap}
              onReset={onReset}
            />
          ))}
        </div>
      </section>

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
