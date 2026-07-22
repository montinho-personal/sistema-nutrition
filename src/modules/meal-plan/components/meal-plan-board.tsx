"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2Icon, MinusIcon, PlusIcon, RefreshCwIcon, RotateCcwIcon, TargetIcon } from "lucide-react";
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
  addFood,
  hasPlanEdits,
  logSwap,
  parseDirective,
  removeFood,
  replaceFood,
  resetOverride,
  restoreFood,
  setFoodGrams,
  setMealDetails,
  setMealPlanEdits,
  updateMealPlanEdits,
} from "@/modules/meal-plan/services";
import { interpretMealInstructionAction } from "@/modules/meal-plan/services/interpretMealInstruction.action";
import { DIRECTIVE_LIMITS, MEAL_OBJECTIVES } from "@/modules/meal-plan/constants/parameters";
import { useStudentPlan } from "@/modules/meal-plan/hooks/use-student-plan";
import { useNutritionistOpinion } from "@/modules/meal-plan/hooks/use-nutritionist-opinion";
import { MealCard } from "@/modules/meal-plan/components/meal-card";
import { MealInstruction } from "@/modules/meal-plan/components/meal-instruction";
import { NutritionistOpinion } from "@/modules/meal-plan/components/nutritionist-opinion";
import type { MealSlot, ReplacementComparison } from "@/modules/meal-plan/types";

const foodById = new Map(curatedFoods.map((f) => [f.id, f]));

/**
 * O cardápio do dia com troca inteligente (Workflow V1 — Etapa 5): objetivo por
 * refeição, opções equivalentes por alimento (Food Intelligence) e recálculo
 * automático a cada troca. As edições são SALVAS automaticamente por aluno e o
 * mesmo cardápio editado alimenta o Parecer, o Documento e o Relatório.
 */
export function MealPlanBoard({ studentId }: { studentId: string }) {
  const {
    student,
    plan,
    restrictions,
    input,
    nextVariant,
    instruction,
    directive,
    setInstruction,
    edits,
    setMealsPerDay,
  } = useStudentPlan(studentId);
  const opinion = useNutritionistOpinion(studentId);
  const [applying, setApplying] = React.useState(false);
  const edited = hasPlanEdits(edits);

  // Nova instrução recomeça do cardápio limpo (o repositório descarta edições
  // residuais). A interpretação é determinística; com IA habilitada, ela
  // enriquece o que o texto esconde (degradando com elegância a qualquer falha).
  const applyInstruction = async (text: string) => {
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

  const swappedKeys = React.useMemo(
    () => new Set(Object.keys(edits?.overrides ?? {})),
    [edits],
  );

  // Cada edição é uma transição pura gravada no repositório (salvamento
  // automático) — o Relatório e o Documento refletem na hora.
  // A troca vem do Motor de Substituição já com a comparação inteira calculada
  // (Documento 08 — o número nunca é recalculado na interface): grava a edição
  // e registra a auditoria (Documento 00 — toda troca é rastreável).
  const onConfirmReplace = (slot: MealSlot, key: string, comparison: ReplacementComparison) => {
    updateMealPlanEdits(studentId, (prev) =>
      replaceFood(prev, key, comparison.replacementFood, comparison.replacementItem.grams),
    );
    logSwap({
      studentId,
      slot,
      key,
      mode: comparison.mode,
      originalFoodId: comparison.originalFood.id,
      originalFoodName: comparison.originalFood.name,
      originalGrams: comparison.originalItem.grams,
      replacementFoodId: comparison.replacementFood.id,
      replacementFoodName: comparison.replacementFood.name,
      replacementGrams: comparison.replacementItem.grams,
      before: {
        kcal: comparison.originalItem.kcal,
        protein: comparison.originalItem.protein,
        carbs: comparison.originalItem.carbs,
        fat: comparison.originalItem.fat,
      },
      after: {
        kcal: comparison.replacementItem.kcal,
        protein: comparison.replacementItem.protein,
        carbs: comparison.replacementItem.carbs,
        fat: comparison.replacementItem.fat,
      },
      goal: student?.mainGoal ?? null,
      rationale: comparison.decision.justification,
    });
    toast.success(
      `Trocado por ${comparison.replacementFood.name.split(",")[0]} — ${comparison.replacementItem.grams} g.`,
    );
  };
  const onReset = (key: string) =>
    updateMealPlanEdits(studentId, (prev) => resetOverride(prev, key));
  const onRemove = (key: string) =>
    updateMealPlanEdits(studentId, (prev) => removeFood(prev, key));
  const onRestore = (key: string) =>
    updateMealPlanEdits(studentId, (prev) => restoreFood(prev, key));
  const onSetGrams = (key: string, grams: number) =>
    updateMealPlanEdits(studentId, (prev) => setFoodGrams(prev, key, grams));
  const onAddFood = (slot: MealSlot, foodId: string) => {
    const food = foodById.get(foodId);
    if (food) updateMealPlanEdits(studentId, (prev) => addFood(prev, slot, food));
  };
  const onEditMeal = (slot: MealSlot, patch: { title?: string | null; time?: string | null }) =>
    updateMealPlanEdits(studentId, (prev) => setMealDetails(prev, slot, patch));
  const changeMealCount = (delta: number) => {
    if (!plan) return;
    const next = plan.meals.length + delta;
    if (next < DIRECTIVE_LIMITS.minMeals || next > DIRECTIVE_LIMITS.maxMeals) return;
    setMealsPerDay(next);
  };
  const discardEdits = () => {
    setMealPlanEdits(studentId, null);
    toast.info("Edições descartadas — cardápio original restaurado.");
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionHeader title="Cardápio" description="Toque em Trocar para ver equivalentes — a conta se ajusta sozinha." />
          <div className="flex items-center gap-2">
            {/* Nº de refeições — controle direto, salvo por aluno. */}
            <div className="flex items-center gap-1 rounded-lg border px-1.5 py-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                title="Menos refeições"
                disabled={plan.meals.length <= DIRECTIVE_LIMITS.minMeals}
                onClick={() => changeMealCount(-1)}
              >
                <MinusIcon className="size-3.5" />
              </Button>
              <span className="min-w-20 text-center text-xs font-medium tabular-nums">
                {plan.meals.length} refeições
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                title="Mais refeições"
                disabled={plan.meals.length >= DIRECTIVE_LIMITS.maxMeals}
                onClick={() => changeMealCount(1)}
              >
                <PlusIcon className="size-3.5" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={nextVariant}>
              <RefreshCwIcon className="size-4" />
              Gerar outra opção
            </Button>
          </div>
        </div>
        {edited ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gold/40 bg-gold/5 px-3 py-2">
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2Icon className="size-3.5 shrink-0 text-gold" />
              Edições salvas automaticamente — o Documento e o Relatório já mostram este
              cardápio editado.
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={discardEdits}
            >
              <RotateCcwIcon className="size-3.5" />
              Voltar ao cardápio original
            </Button>
          </div>
        ) : null}
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
              goal={student?.mainGoal ?? undefined}
              dayTotals={plan.totals}
              dayTarget={plan.target}
              onConfirmReplace={(key, comparison) => onConfirmReplace(meal.slot, key, comparison)}
              onReset={onReset}
              onRemove={onRemove}
              onRestore={onRestore}
              onAddFood={onAddFood}
              onEditMeal={onEditMeal}
              onSetGrams={onSetGrams}
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
