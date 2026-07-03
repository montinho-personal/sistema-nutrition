import { describe, expect, it } from "vitest";

import { curatedFoods } from "@/modules/foods/data/curatedFoods";
import {
  buildMealPlan,
  findFoodSwaps,
  isTimingAppropriate,
  type MealPlanContext,
} from "@/modules/meal-plan/services";
import type { Food } from "@/modules/foods/types";

const BASE_CTX: MealPlanContext = {
  goal: "weight_loss",
  mealsPerDay: 5,
  macros: { kcal: 2000, protein: 160, carbs: 200, fat: 60 },
  emphasizeSatiety: false,
  emphasizePracticality: false,
  budgetTight: false,
  restrictions: [],
  variant: 0,
};

const byId = (id: string): Food => {
  const f = curatedFoods.find((x) => x.id === id);
  if (!f) throw new Error(`fixture ausente: ${id}`);
  return f;
};

const nameOf = (id: string) => byId(id).name.toLowerCase();

describe("coerência de horário — cada alimento na refeição certa", () => {
  it("todos os itens de cada refeição combinam com o momento do dia", () => {
    const plan = buildMealPlan(curatedFoods, BASE_CTX);
    for (const meal of plan.meals) {
      for (const item of meal.items) {
        expect(isTimingAppropriate(byId(item.foodId), meal.timing)).toBe(true);
      }
    }
  });

  it("arroz e feijão nunca caem no café da manhã nem nos lanches", () => {
    // O caso que o usuário relatou: arroz/feijão vazando para café/lanche.
    const plan = buildMealPlan(curatedFoods, {
      ...BASE_CTX,
      // Hábitos com arroz/feijão não devem forçá-los fora de almoço/jantar.
      habitualFoodIds: curatedFoods
        .filter((f) => /arroz|feij[ãa]o/i.test(f.name))
        .map((f) => f.id),
    });
    const offMeals = plan.meals.filter((m) => m.timing === "breakfast" || m.timing === "snack");
    for (const meal of offMeals) {
      for (const item of meal.items) {
        expect(/arroz|feij[ãa]o/i.test(nameOf(item.foodId))).toBe(false);
      }
    }
  });

  it("aveia e pão nunca caem no almoço ou no jantar", () => {
    const plan = buildMealPlan(curatedFoods, BASE_CTX);
    const mainMeals = plan.meals.filter((m) => m.timing === "lunch" || m.timing === "dinner");
    for (const meal of mainMeals) {
      for (const item of meal.items) {
        expect(/aveia|p[ãa]o/i.test(nameOf(item.foodId))).toBe(false);
      }
    }
  });

  it("arroz do almoço combina com o momento; aveia não", () => {
    const arrozBranco = curatedFoods.find((f) => /arroz.*branco/i.test(f.name))!;
    const aveia = curatedFoods.find((f) => /aveia/i.test(f.name))!;
    expect(isTimingAppropriate(arrozBranco, "lunch")).toBe(true);
    expect(isTimingAppropriate(arrozBranco, "breakfast")).toBe(false);
    expect(isTimingAppropriate(aveia, "breakfast")).toBe(true);
    expect(isTimingAppropriate(aveia, "lunch")).toBe(false);
  });
});

describe("o prato brasileiro — arroz e feijão nas refeições principais", () => {
  it("almoço e jantar trazem um grão (carbo) E uma leguminosa (feijão)", () => {
    const plan = buildMealPlan(curatedFoods, BASE_CTX);
    const mains = plan.meals.filter((m) => m.timing === "lunch" || m.timing === "dinner");
    expect(mains.length).toBeGreaterThan(0);
    for (const meal of mains) {
      const roles = meal.items.map((i) => i.role);
      expect(roles).toContain("carb"); // arroz/batata/macarrão
      expect(roles).toContain("legume"); // feijão/lentilha/grão-de-bico
      // A leguminosa é do grupo certo (feijão e afins), não tofu/PTS.
      const legume = meal.items.find((i) => i.role === "legume")!;
      expect(byId(legume.foodId).foodGroup).toBe("Leguminosas");
    }
  });

  it("café da manhã e lanches nunca têm o papel de leguminosa", () => {
    const plan = buildMealPlan(curatedFoods, BASE_CTX);
    const light = plan.meals.filter((m) => m.timing === "breakfast" || m.timing === "snack");
    for (const meal of light) {
      expect(meal.items.some((i) => i.role === "legume")).toBe(false);
    }
  });

  it("planos veganos mantêm a proteína (tofu/PTS não viram só acompanhamento)", () => {
    const plan = buildMealPlan(curatedFoods, { ...BASE_CTX, restrictions: ["vegano"] });
    const mains = plan.meals.filter((m) => m.timing === "lunch" || m.timing === "dinner");
    for (const meal of mains) {
      expect(meal.items.some((i) => i.role === "protein")).toBe(true);
    }
    expect(plan.accuracy.protein).toBeGreaterThanOrEqual(70);
  });
});

describe("trocas coerentes com o horário", () => {
  it("os equivalentes de um carbo de almoço respeitam o almoço", () => {
    const plan = buildMealPlan(curatedFoods, BASE_CTX);
    const lunch = plan.meals.find((m) => m.timing === "lunch")!;
    const carb = lunch.items.find((i) => i.role === "carb");
    expect(carb).toBeDefined();
    const swaps = findFoodSwaps(carb!, curatedFoods, [], "lunch");
    expect(swaps.length).toBeGreaterThan(0);
    for (const { food } of swaps) {
      expect(isTimingAppropriate(food, "lunch")).toBe(true);
    }
  });
});
