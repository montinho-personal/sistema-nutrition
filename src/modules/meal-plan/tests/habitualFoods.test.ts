import { describe, expect, it } from "vitest";

import { buildMealPlan, type MealPlanContext } from "@/modules/meal-plan/services";
import { extractHabitualFoodIds } from "@/modules/diagnosis/services";
import { curatedFoods } from "@/modules/foods/data/curatedFoods";

const baseCtx = (over: Partial<MealPlanContext> = {}): MealPlanContext => ({
  goal: "weight_loss",
  mealsPerDay: 4,
  macros: { kcal: 2000, protein: 160, carbs: 200, fat: 60 },
  emphasizeSatiety: false,
  emphasizePracticality: false,
  budgetTight: false,
  restrictions: [],
  variant: 0,
  ...over,
});

const foodIds = (plan: ReturnType<typeof buildMealPlan>) =>
  new Set(plan.meals.flatMap((m) => m.items.map((i) => i.foodId)));

describe("cardápio baseado nos hábitos", () => {
  it("reconhece os alimentos que o aluno relata comer", () => {
    const ids = extractHabitualFoodIds({
      breakfast: "café com tapioca e ovo",
      lunch: "arroz, feijão e frango",
      snacks: "banana e castanhas",
    });
    expect(ids.length).toBeGreaterThan(0);
    // Deve reconhecer alimentos por nome (frango, arroz, ovo, banana...).
    const names = curatedFoods.filter((f) => ids.includes(f.id)).map((f) => f.name.toLowerCase());
    expect(names.some((n) => n.includes("frango"))).toBe(true);
    expect(names.some((n) => n.includes("arroz"))).toBe(true);
  });

  it("prioriza no cardápio os alimentos habituais (mesmo papel)", () => {
    const habitualFoodIds = extractHabitualFoodIds({
      lunch: "arroz, feijão e frango",
      breakfast: "ovo e banana",
    });
    const withHabits = buildMealPlan(curatedFoods, baseCtx({ habitualFoodIds }));
    // Os alimentos habituais reconhecidos entram no cardápio.
    const inPlan = foodIds(withHabits);
    const usedHabitual = habitualFoodIds.filter((id) => inPlan.has(id));
    expect(usedHabitual.length).toBeGreaterThan(0);
    // E a nota indica que o cardápio seguiu os hábitos.
    expect(withHabits.notes.some((n) => n.includes("no que você já come"))).toBe(true);
  });

  it("sem hábitos informados, monta normalmente (sem a nota de hábitos)", () => {
    const plan = buildMealPlan(curatedFoods, baseCtx());
    expect(plan.meals.length).toBeGreaterThan(0);
    expect(plan.notes.some((n) => n.includes("no que você já come"))).toBe(false);
  });

  it("mantém o alvo de proteína mesmo seguindo hábitos pobres em proteína", () => {
    // Só carboidrato/fruta nos hábitos → o motor ainda garante a proteína.
    const habitualFoodIds = extractHabitualFoodIds({ breakfast: "pão, banana e café" });
    const plan = buildMealPlan(curatedFoods, baseCtx({ habitualFoodIds }));
    // Proteína do cardápio fica próxima do alvo (o papel de proteína entra).
    expect(plan.accuracy.protein).toBeGreaterThanOrEqual(70);
  });
});
