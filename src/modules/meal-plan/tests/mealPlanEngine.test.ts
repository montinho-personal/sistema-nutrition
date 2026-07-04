import { describe, expect, it } from "vitest";

import { curatedFoods } from "@/modules/foods/data/curatedFoods";
import { buildMealPlan, classifyRole, type MealPlanContext } from "@/modules/meal-plan/services";
import type { Food } from "@/modules/foods/types";

function food(id: string): Food {
  const f = curatedFoods.find((x) => x.id === id);
  if (!f) throw new Error(`fixture ausente: ${id}`);
  return f;
}

const BASE_CTX: MealPlanContext = {
  goal: "weight_loss",
  mealsPerDay: 4,
  macros: { kcal: 2000, protein: 160, carbs: 200, fat: 60 },
  emphasizeSatiety: false,
  emphasizePracticality: false,
  budgetTight: false,
  restrictions: [],
  variant: 0,
};

describe("classifyRole", () => {
  it("classifica proteína, carbo, gordura e vegetal por dominância", () => {
    expect(classifyRole(food("FIE001"))).toBe("protein"); // Frango
    expect(classifyRole(food("FIE002"))).toBe("protein"); // Ovo (proteína antes de gordura)
    expect(classifyRole(food("FIE009"))).toBe("carb"); // Arroz branco
    expect(classifyRole(food("FIE019"))).toBe("fat"); // Azeite
    expect(classifyRole(food("FIE023"))).toBe("veg"); // Brócolis (baixa caloria)
  });

  it("feijão é leguminosa; tofu/PTS (proteína-dominantes) seguem proteína", () => {
    expect(classifyRole(food("FIE013"))).toBe("legume"); // Feijão carioca
    expect(classifyRole(food("FIE049"))).toBe("legume"); // Feijão preto
    expect(classifyRole(food("FIE051"))).toBe("protein"); // Tofu — fonte proteica
  });
});

describe("buildMealPlan — estrutura", () => {
  it("gera exatamente o nº de refeições da estratégia", () => {
    expect(buildMealPlan(curatedFoods, { ...BASE_CTX, mealsPerDay: 3 }).meals).toHaveLength(3);
    expect(buildMealPlan(curatedFoods, { ...BASE_CTX, mealsPerDay: 5 }).meals).toHaveLength(5);
    expect(buildMealPlan(curatedFoods, { ...BASE_CTX, mealsPerDay: 6 }).meals).toHaveLength(6);
  });

  it("cada refeição tem itens e o total do dia bate o alvo com precisão", () => {
    const plan = buildMealPlan(curatedFoods, BASE_CTX);
    for (const meal of plan.meals) expect(meal.items.length).toBeGreaterThan(0);
    // Solver de resíduo: proteína (macro prioritário) fecha justo, sem o
    // overshoot do encadeamento ingênuo; calorias próximas do alvo.
    expect(plan.accuracy.protein).toBeGreaterThanOrEqual(92);
    expect(plan.accuracy.protein).toBeLessThanOrEqual(115);
    expect(plan.accuracy.kcal).toBeGreaterThanOrEqual(88);
    expect(plan.accuracy.kcal).toBeLessThanOrEqual(112);
  });

  it("a proteína não estoura por dupla contagem entre alimentos", () => {
    // Café + aveia + pasta de amendoim: cereais e gordura somam proteína; a
    // porção proteica deve encolher para compensar (nunca > ~115% no dia).
    const plan = buildMealPlan(curatedFoods, { ...BASE_CTX, goal: "hypertrophy", mealsPerDay: 5 });
    expect(plan.accuracy.protein).toBeLessThanOrEqual(115);
  });

  it("o total do dia é a soma das refeições", () => {
    const plan = buildMealPlan(curatedFoods, BASE_CTX);
    const sum = plan.meals.reduce((acc, m) => acc + m.totals.kcal, 0);
    expect(plan.totals.kcal).toBe(sum);
  });
});

describe("buildMealPlan — porções realistas (bom senso)", () => {
  const foodById = (id: string) => curatedFoods.find((f) => f.id === id)!;

  it("prefere proteínas densas — nada de ricota/tofu em porção gigante", () => {
    const plan = buildMealPlan(curatedFoods, BASE_CTX);
    for (const meal of plan.meals) {
      for (const item of meal.items) {
        if (item.role !== "protein") continue;
        const food = foodById(item.foodId);
        // Proteína densa o bastante para caber numa porção sensata.
        expect(food.nutrition.proteinG ?? 0).toBeGreaterThanOrEqual(12);
        // Sem porções absurdas (o teto de bom senso).
        expect(item.grams).toBeLessThanOrEqual(240);
      }
    }
  });

  it("não usa ultraprocessado (whey em pó) como proteína padrão", () => {
    const plan = buildMealPlan(curatedFoods, BASE_CTX);
    for (const meal of plan.meals) {
      for (const item of meal.items) {
        expect(foodById(item.foodId).processingLevel).not.toBe("ultra_processed");
      }
    }
  });

  it("respeita os tetos de porção de todos os papéis", () => {
    const plan = buildMealPlan(curatedFoods, { ...BASE_CTX, mealsPerDay: 5 });
    const limits = { protein: 240, carb: 320, legume: 160, fat: 55, veg: 200 } as const;
    for (const meal of plan.meals) {
      for (const item of meal.items) {
        expect(item.grams).toBeLessThanOrEqual(limits[item.role]);
      }
    }
  });
});

describe("buildMealPlan — restrições", () => {
  it("vegano nunca inclui carne, peixe, ovo ou laticínio", () => {
    const plan = buildMealPlan(curatedFoods, { ...BASE_CTX, restrictions: ["vegano"] });
    const excluded = new Set(["Carnes", "Pescados", "Ovos", "Laticínios"]);
    for (const meal of plan.meals) {
      for (const item of meal.items) {
        const group = curatedFoods.find((f) => f.id === item.foodId)?.foodGroup ?? "";
        expect(excluded.has(group)).toBe(false);
      }
    }
    expect(plan.notes.some((n) => n.includes("vegano"))).toBe(true);
  });

  it("sem glúten não inclui pão", () => {
    const plan = buildMealPlan(curatedFoods, { ...BASE_CTX, restrictions: ["sem_gluten"] });
    for (const meal of plan.meals) {
      for (const item of meal.items) {
        expect(/p[ãa]o/i.test(item.foodName)).toBe(false);
      }
    }
  });
});

describe("buildMealPlan — determinismo e variação", () => {
  it("mesmo contexto + mesma variante = mesmo plano", () => {
    const a = buildMealPlan(curatedFoods, BASE_CTX);
    const b = buildMealPlan(curatedFoods, BASE_CTX);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("variante diferente pode trocar a seleção de alimentos", () => {
    const a = buildMealPlan(curatedFoods, { ...BASE_CTX, variant: 0 });
    const b = buildMealPlan(curatedFoods, { ...BASE_CTX, variant: 1 });
    const idsA = a.meals.flatMap((m) => m.items.map((i) => i.foodId)).join(",");
    const idsB = b.meals.flatMap((m) => m.items.map((i) => i.foodId)).join(",");
    expect(idsA).not.toBe(idsB);
  });
});
