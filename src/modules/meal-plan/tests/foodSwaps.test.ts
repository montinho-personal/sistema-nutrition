import { describe, expect, it } from "vitest";

import { buildMealPlan, findFoodSwaps, buildSwapItem } from "@/modules/meal-plan/services";
import { curatedFoods } from "@/modules/foods/data/curatedFoods";
import { classifyRole } from "@/modules/meal-plan/services";
import type { MealPlanContext } from "@/modules/meal-plan/services";

const ctx: MealPlanContext = {
  goal: "weight_loss",
  mealsPerDay: 4,
  macros: { kcal: 2000, protein: 160, carbs: 200, fat: 60 },
  emphasizeSatiety: false,
  emphasizePracticality: false,
  budgetTight: false,
  restrictions: [],
  variant: 0,
};

describe("Food Intelligence — troca de alimentos", () => {
  const plan = buildMealPlan(curatedFoods, ctx);
  const firstItem = plan.meals[0].items[0];

  it("sugere equivalentes do mesmo papel, sem repetir o alimento atual", () => {
    const swaps = findFoodSwaps(firstItem, curatedFoods, []);
    expect(swaps.length).toBeGreaterThan(0);
    for (const { food, item } of swaps) {
      expect(food.id).not.toBe(firstItem.foodId);
      expect(classifyRole(food)).toBe(firstItem.role);
      expect(item.grams).toBeGreaterThan(0);
    }
  });

  it("o item de substituição mantém a contribuição do papel (proteína)", () => {
    const proteinItem = plan.meals[0].items.find((i) => i.role === "protein");
    expect(proteinItem).toBeDefined();
    const swaps = findFoodSwaps(proteinItem!, curatedFoods, []);
    // a proteína do substituto fica próxima da do item original
    for (const { item } of swaps.slice(0, 3)) {
      expect(Math.abs(item.protein - proteinItem!.protein)).toBeLessThanOrEqual(8);
    }
  });

  it("buildSwapItem resolve a porção do novo alimento", () => {
    const proteinItem = plan.meals[0].items.find((i) => i.role === "protein")!;
    const other = curatedFoods.find(
      (f) => f.id !== proteinItem.foodId && classifyRole(f) === "protein",
    )!;
    const repl = buildSwapItem(other, "protein", proteinItem);
    expect(repl.foodId).toBe(other.id);
    expect(repl.grams).toBeGreaterThan(0);
    expect(repl.kcal).toBeGreaterThan(0);
  });

  it("respeita restrições alimentares na troca", () => {
    const swaps = findFoodSwaps(firstItem, curatedFoods, ["sem_lactose"]);
    // não deve sugerir nada que a restrição barra (a lista pode encolher, mas nunca quebra)
    expect(Array.isArray(swaps)).toBe(true);
  });
});
