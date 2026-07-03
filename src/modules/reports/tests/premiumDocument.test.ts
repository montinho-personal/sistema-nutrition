import { describe, expect, it } from "vitest";

import { buildPremiumDocument } from "@/modules/reports/services";
import { buildDiagnosisDashboard } from "@/modules/diagnosis/services";
import { computeScoreMap } from "@/modules/diagnosis/services";
import { buildMealPlan, type MealPlanContext } from "@/modules/meal-plan/services";
import { curatedFoods } from "@/modules/foods/data/curatedFoods";

const planCtx: MealPlanContext = {
  goal: "weight_loss",
  mealsPerDay: 4,
  macros: { kcal: 2000, protein: 160, carbs: 200, fat: 60 },
  emphasizeSatiety: false,
  emphasizePracticality: false,
  budgetTight: false,
  restrictions: [],
  variant: 0,
};
const plan = buildMealPlan(curatedFoods, planCtx);

const dashboard = buildDiagnosisDashboard({
  answers: {},
  scores: computeScoreMap({ discipline: 7 }),
  goal: "weight_loss",
  ageYears: 36,
  weightKg: 82,
  heightCm: 178,
  tdee: 2725,
});

const doc = buildPremiumDocument({
  firstName: "Renato",
  studentName: "Renato Camargo",
  goalLabel: "Emagrecimento",
  ageYears: 36,
  generatedAt: "3 de julho de 2026",
  velocityLabel: "Intensiva",
  directionLabel: "Déficit calórico",
  approachLabel: "Flexível",
  approachEmphasis: "Liberdade",
  mealsPerDay: 4,
  macros: { calories: 2070, proteinG: 164, carbG: 205, fatG: 66 },
  dashboard,
  plan,
  foods: curatedFoods,
});

describe("documento premium", () => {
  it("personaliza a mensagem com o nome e o objetivo", () => {
    expect(doc.message).toContain("Renato");
    expect(doc.message.toLowerCase()).toContain("emagrecimento");
  });

  it("gera a justificativa da estratégia com abordagem e velocidade", () => {
    expect(doc.strategy.justification).toContain("Flexível");
    expect(doc.strategy.justification.toLowerCase()).toContain("intensiva");
  });

  it("agrega a lista de compras por alimento e categoria", () => {
    expect(doc.shoppingList.length).toBeGreaterThan(0);
    for (const group of doc.shoppingList) {
      expect(group.items.length).toBeGreaterThan(0);
      for (const it of group.items) expect(it.grams).toBeGreaterThan(0);
    }
    // a soma das gramas da lista bate com a soma das gramas do cardápio
    const listGrams = doc.shoppingList.flatMap((g) => g.items).reduce((s, i) => s + i.grams, 0);
    const planGrams = plan.meals.flatMap((m) => m.items).reduce((s, i) => s + i.grams, 0);
    expect(listGrams).toBe(planGrams);
  });

  it("traz todas as seções de orientação e o cardápio", () => {
    expect(doc.meals.length).toBe(plan.meals.length);
    expect(doc.guidance.restaurant.length).toBeGreaterThan(0);
    expect(doc.guidance.travel.length).toBeGreaterThan(0);
    expect(doc.guidance.weekend.length).toBeGreaterThan(0);
    expect(doc.guidance.planB.length).toBeGreaterThan(0);
    expect(doc.schedule.length).toBeGreaterThan(0);
    expect(doc.nextSteps.length).toBeGreaterThan(0);
    expect(doc.hydrationL).toBeGreaterThan(0);
  });
});
