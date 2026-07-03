import { describe, expect, it } from "vitest";

import { curatedFoods } from "@/modules/foods/data/curatedFoods";
import {
  applyDirective,
  buildMealPlan,
  overrideCalories,
  parseDirective,
  type MealPlanContext,
} from "@/modules/meal-plan/services";

const BASE_CTX: MealPlanContext = {
  goal: "weight_loss",
  mealsPerDay: 4,
  macros: { kcal: 2200, protein: 176, carbs: 217, fat: 70 },
  emphasizeSatiety: false,
  emphasizePracticality: false,
  budgetTight: false,
  restrictions: [],
  variant: 0,
};

describe("parseDirective — interpreta a instrução em linguagem natural", () => {
  it("os três exemplos do spec", () => {
    const a = parseDirective("Monte um cardápio de 1700 kcal com zero carboidrato à noite.");
    expect(a.caloriesOverride).toBe(1700);
    expect(a.noCarbAtNight).toBe(true);

    const b = parseDirective("Quero uma dieta barata");
    expect(b.budgetTight).toBe(true);

    const c = parseDirective("Quero refeições extremamente rápidas");
    expect(c.emphasizePracticality).toBe(true);
  });

  it("nº de refeições, saciedade e restrições comuns", () => {
    const d = parseDirective("5 refeições, foco em saciedade, sem lactose e sem glúten");
    expect(d.mealsPerDay).toBe(5);
    expect(d.emphasizeSatiety).toBe(true);
    expect(d.addRestrictions).toContain("sem_lactose");
    expect(d.addRestrictions).toContain("sem_gluten");
  });

  it("vegano e vegetariano", () => {
    expect(parseDirective("cardápio vegano").addRestrictions).toContain("vegano");
    expect(parseDirective("prefiro vegetariano").addRestrictions).toContain("vegetariano");
  });

  it("calorias fora da faixa são limitadas; texto vazio não reconhece nada", () => {
    expect(parseDirective("90000 kcal").caloriesOverride).toBeLessThanOrEqual(6000);
    const empty = parseDirective("   ");
    expect(empty.recognized).toHaveLength(0);
    expect(empty.caloriesOverride).toBeNull();
  });

  it("'sem carboidrato' sem menção à noite não vira noCarbAtNight", () => {
    expect(parseDirective("quero pouco carboidrato no geral").noCarbAtNight).toBe(false);
  });
});

describe("overrideCalories — ancora a proteína, flexibiliza carbo/gordura", () => {
  it("mantém a proteína e bate a nova meta calórica", () => {
    const out = overrideCalories({ kcal: 2200, protein: 176, carbs: 217, fat: 70 }, 1700);
    expect(out.protein).toBe(176);
    const kcal = out.protein * 4 + out.carbs * 4 + out.fat * 9;
    expect(Math.abs(kcal - 1700)).toBeLessThanOrEqual(10);
  });
});

describe("applyDirective + motor — a instrução muda o cardápio", () => {
  it("sobrescreve calorias e nº de refeições", () => {
    const ctx = applyDirective(BASE_CTX, parseDirective("1500 kcal, 5 refeições"));
    expect(ctx.mealsPerDay).toBe(5);
    expect(ctx.macros.kcal).toBe(1500);
    const plan = buildMealPlan(curatedFoods, ctx);
    expect(plan.meals).toHaveLength(5);
    expect(plan.target.kcal).toBe(1500);
  });

  it("'zero carbo à noite': jantar/ceia sem carbo, e o dia ainda bate as calorias", () => {
    const ctx = applyDirective(
      { ...BASE_CTX, mealsPerDay: 5 },
      parseDirective("sem carboidrato à noite"),
    );
    expect(ctx.noCarbAtNight).toBe(true);
    const plan = buildMealPlan(curatedFoods, ctx);
    const evening = plan.meals.filter((m) => m.timing === "dinner" || m.timing === "supper");
    expect(evening.length).toBeGreaterThan(0);
    for (const meal of evening) {
      expect(meal.items.some((i) => i.role === "carb" || i.role === "legume")).toBe(false);
    }
    // A gordura fecha a energia — o dia não desaba de calorias.
    expect(plan.accuracy.kcal).toBeGreaterThanOrEqual(85);
    expect(plan.notes.some((n) => n.includes("sem carboidrato"))).toBe(true);
  });

  it("instrução vazia mantém o cardápio padrão", () => {
    const ctx = applyDirective(BASE_CTX, parseDirective(""));
    expect(ctx).toEqual(BASE_CTX);
  });
});
