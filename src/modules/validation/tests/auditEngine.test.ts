import { describe, expect, it } from "vitest";

import { auditStrategy, type AuditInput } from "@/modules/validation/services";
import { buildMealPlan, type MealPlanContext } from "@/modules/meal-plan/services";
import { curatedFoods } from "@/modules/foods/data/curatedFoods";
import { computeScoreMap } from "@/modules/diagnosis/services";

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

const baseInput = (over: Partial<AuditInput> = {}): AuditInput => ({
  calories: 2000,
  proteinG: 160, // ~2 g/kg em 80 kg
  tdee: 2600,
  direction: "deficit",
  weightKg: 80,
  plan,
  foods: curatedFoods,
  scores: computeScoreMap({ discipline: 7, self_efficacy: 7 }),
  mealsPerDay: 4,
  ...over,
});

describe("motor de validação — auditoria", () => {
  it("nunca fica vazia e sempre traz lembretes de contingência (review)", () => {
    const r = auditStrategy(baseInput());
    expect(r.checks.length).toBeGreaterThanOrEqual(10);
    expect(r.summary.review).toBeGreaterThanOrEqual(4); // fim de semana, viagem, suplementos, plano B
    // a soma dos status bate com o total
    expect(r.summary.ok + r.summary.attention + r.summary.review).toBe(r.checks.length);
  });

  it("proteína adequada passa; proteína baixa vira atenção", () => {
    const ok = auditStrategy(baseInput()).checks.find((c) => c.id === "protein");
    expect(ok?.status).toBe("ok");
    const low = auditStrategy(baseInput({ proteinG: 90 })).checks.find((c) => c.id === "protein");
    expect(low?.status).toBe("attention");
  });

  it("déficit dentro do limite passa; déficit agressivo vira atenção", () => {
    const ok = auditStrategy(baseInput({ calories: 2100 })).checks.find((c) => c.id === "deficit");
    expect(ok?.status).toBe("ok");
    const deep = auditStrategy(baseInput({ calories: 1500 })).checks.find((c) => c.id === "deficit");
    expect(deep?.status).toBe("attention");
  });

  it("orienta, nunca bloqueia — sempre há checks e nenhum status é de erro rígido", () => {
    const r = auditStrategy(baseInput({ proteinG: 60, calories: 1200 }));
    for (const c of r.checks) {
      expect(["ok", "attention", "review"]).toContain(c.status);
    }
  });
});
