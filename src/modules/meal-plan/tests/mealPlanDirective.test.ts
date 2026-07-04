import { describe, expect, it } from "vitest";

import { curatedFoods } from "@/modules/foods/data/curatedFoods";
import {
  applyDirective,
  buildMealPlan,
  overrideCalories,
  parseDirective,
  resolveFoodName,
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

describe("alimentos por refeição — o cardápio usa o que o treinador pediu", () => {
  const INSTRUCTION = `Quero uma dieta de 1800 calorias. Quero 4 refeicoes e que contenham esses alimentos:
Cafe da manha: aveia, whey e pasta de amendoim
Almoco: arroz, legumes e frango
Tarde: Pao, ovos, whey e banana
Janta: Arroz, legume e frango`;

  it("parseDirective extrai os alimentos de cada refeição", () => {
    const d = parseDirective(INSTRUCTION);
    expect(d.caloriesOverride).toBe(1800);
    expect(d.mealsPerDay).toBe(4);
    expect(d.mealFoods.breakfast).toEqual(["aveia", "whey", "pasta de amendoim"]);
    expect(d.mealFoods.lunch).toEqual(["arroz", "legumes", "frango"]);
    expect(d.mealFoods.afternoon_snack).toEqual(["Pao", "ovos", "whey", "banana"]);
    expect(d.mealFoods.dinner).toEqual(["Arroz", "legume", "frango"]);
  });

  it("resolveFoodName casa nomes livres (ovos→Ovo, legumes→vegetal, sem cair na categoria)", () => {
    expect(resolveFoodName(curatedFoods, "ovos")!.name).toMatch(/^Ovo/);
    expect(resolveFoodName(curatedFoods, "whey")!.name.toLowerCase()).toContain("whey");
    expect(resolveFoodName(curatedFoods, "pasta de amendoim")!.name.toLowerCase()).toContain(
      "pasta de amendoim",
    );
    // "legumes" vira um vegetal (não uma carne da categoria "Carnes e ovos").
    const legume = resolveFoodName(curatedFoods, "legumes")!;
    expect(legume.foodGroup).not.toBe("Carnes");
  });

  it("cada refeição contém os alimentos pedidos e o dia bate as calorias", () => {
    const ctx = applyDirective(
      { ...BASE_CTX, mealsPerDay: 4 },
      parseDirective(INSTRUCTION),
    );
    const plan = buildMealPlan(curatedFoods, ctx);
    const named = (slot: string) =>
      plan.meals.find((m) => m.slot === slot)!.items.map((i) => i.foodName.toLowerCase());

    expect(named("breakfast").some((n) => n.includes("aveia"))).toBe(true);
    expect(named("breakfast").some((n) => n.includes("whey"))).toBe(true);
    expect(named("breakfast").some((n) => n.includes("amendoim"))).toBe(true);
    expect(named("lunch").some((n) => n.includes("arroz"))).toBe(true);
    expect(named("lunch").some((n) => n.includes("frango"))).toBe(true);
    expect(named("afternoon_snack").some((n) => n.startsWith("ovo"))).toBe(true);

    expect(plan.accuracy.kcal).toBeGreaterThanOrEqual(90);
    expect(plan.notes.some((n) => n.includes("os alimentos que você pediu"))).toBe(true);
  });
});
