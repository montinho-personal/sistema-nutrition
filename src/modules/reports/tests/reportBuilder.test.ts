import { describe, expect, it } from "vitest";

import { curatedFoods } from "@/modules/foods/data/curatedFoods";
import { buildStudentReport } from "@/modules/reports/services";
import type { Student } from "@/modules/students/types";
import type { DiagnosisSession } from "@/modules/diagnosis/types";
import type { StrategyRecord } from "@/modules/strategy/types";
import type { FollowUp } from "@/modules/follow-ups/types";
import type { MealPlanPref } from "@/modules/meal-plan/types";

const student: Student = {
  id: "s1",
  fullName: "Renato Teste",
  sex: "male",
  birthDate: "1990-05-10",
  heightCm: 178,
  mainGoal: "weight_loss",
  email: null,
  phone: null,
  notes: null,
  createdAt: "2026-05-01T12:00:00.000Z",
  updatedAt: "2026-05-01T12:00:00.000Z",
};

const session: DiagnosisSession = {
  id: "dx1",
  studentId: "s1",
  status: "completed",
  answers: {
    motivation_level: 8,
    discipline: 6,
    hunger_level: 7,
    all_or_nothing: 8,
    budget: "apertado",
    restrictions: ["nenhuma"],
    trains: "regular",
    activity: "moderado",
  },
  currentStageIndex: 9,
  startedAt: "2026-05-01T12:00:00.000Z",
  updatedAt: "2026-05-01T12:10:00.000Z",
  completedAt: "2026-05-01T12:10:00.000Z",
};

const record: StrategyRecord = {
  studentId: "s1",
  input: { currentWeightKg: 92, bodyFatPct: 24 },
  createdAt: "2026-05-01T12:00:00.000Z",
  updatedAt: "2026-05-01T12:00:00.000Z",
};

const input = {
  student,
  session,
  record,
  followUps: [] as FollowUp[],
  foods: curatedFoods,
  generatedAt: "2026-06-01",
};

describe("buildStudentReport", () => {
  it("retorna null sem estratégia (cadeia incompleta)", () => {
    expect(buildStudentReport({ ...input, record: null })).toBeNull();
  });

  it("retorna null com diagnóstico não concluído", () => {
    const incomplete = { ...session, status: "in_progress" as const };
    expect(buildStudentReport({ ...input, session: incomplete })).toBeNull();
  });

  it("consolida todas as seções quando a cadeia está completa", () => {
    const report = buildStudentReport(input);
    expect(report).not.toBeNull();
    expect(report!.meta.studentName).toBe("Renato Teste");
    expect(report!.meta.goalLabel).toBe("Emagrecimento");
    expect(report!.scores.length).toBeGreaterThan(0);
    expect(report!.strategy.decisions).toHaveLength(12);
    expect(report!.macros.calories).toBeGreaterThan(0);
    expect(report!.mealPlan.meals.length).toBe(report!.strategy.mealsPerDay);
    expect(report!.roadmap.phases).toHaveLength(7);
    // sem acompanhamentos ainda
    expect(report!.evolution).toBeNull();
  });

  it("o nº de refeições do controle e o nome/horário editados valem no relatório", () => {
    const mealPref: MealPlanPref = {
      studentId: "s1",
      variant: 0,
      instruction: "4 refeições",
      directive: null,
      // O controle do quadro (5) vence a instrução (4).
      mealsPerDay: 5,
      edits: {
        overrides: {},
        removed: [],
        extras: {},
        meals: { breakfast: { title: "Café reforçado", time: "07:30" } },
      },
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    const report = buildStudentReport({ ...input, mealPref })!;
    expect(report.mealPlan.meals).toHaveLength(5);
    const breakfast = report.mealPlan.meals.find((m) => m.slot === "breakfast")!;
    expect(breakfast.title).toBe("Café reforçado");
    expect(breakfast.time).toBe("07:30");
  });

  it("a projeção de peso entra no relatório, coerente com os macros", () => {
    const report = buildStudentReport(input)!;
    expect(report.weightProjection.startKg).toBe(92);
    expect(report.weightProjection.weeklyKg).toBeLessThan(0); // déficit → perda
    expect(report.weightProjection.actual).toHaveLength(1); // sem acompanhamentos
    expect(report.weightProjection.last).toBeNull();
  });

  it("a capa recebe a meta da Definição Estratégica (quando houver)", () => {
    const noTarget = buildStudentReport(input)!;
    expect(noTarget.meta.targetChangeKg).toBeNull();
    expect(noTarget.meta.targetWeeks).toBeNull();

    const withTarget = buildStudentReport({
      ...input,
      record: { ...record, input: { ...record.input, targetChangeKg: 6, targetWeeks: 12 } },
    })!;
    expect(withTarget.meta.targetChangeKg).toBe(6);
    expect(withTarget.meta.targetWeeks).toBe(12);
  });

  it("o cardápio do relatório respeita a instrução e as edições do treinador", () => {
    // Sem preferências: cardápio padrão.
    const base = buildStudentReport(input)!;
    const meal = base.mealPlan.meals[0];
    const removedItem = meal.items[0];
    const adjustedItem = meal.items[1];

    // Preferências do Plano Alimentar: instrução "1700 kcal" + edições manuais
    // (um item removido, outro com gramas fixadas pelo treinador).
    const mealPref: MealPlanPref = {
      studentId: "s1",
      variant: 0,
      instruction: "1700 kcal",
      directive: null,
      edits: {
        overrides: { [`${meal.slot}:${adjustedItem.role}`]: { foodId: null, grams: 123 } },
        removed: [`${meal.slot}:${removedItem.role}`],
        extras: {},
      },
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    const report = buildStudentReport({ ...input, mealPref })!;

    // A instrução vale (alvo calórico) e as edições aparecem no relatório.
    expect(report.mealPlan.target.kcal).toBe(1700);
    // Os cards de Macros mostram a MESMA conta do cardápio (nunca divergem).
    expect(report.macros.calories).toBe(1700);
    expect(report.macros.proteinG).toBe(report.mealPlan.target.protein);
    expect(report.macros.carbG).toBe(report.mealPlan.target.carbs);
    expect(report.macros.fatG).toBe(report.mealPlan.target.fat);
    const items = report.mealPlan.meals[0].items;
    expect(items.some((i) => i.role === removedItem.role)).toBe(false);
    expect(items.find((i) => i.role === adjustedItem.role)?.grams).toBe(123);
    // E os totais são recalculados sobre o cardápio editado.
    expect(report.mealPlan.totals.kcal).not.toBe(base.mealPlan.totals.kcal);
  });

  it("inclui evolução quando há acompanhamentos", () => {
    const followUps: FollowUp[] = [
      {
        id: "fu1",
        studentId: "s1",
        date: "2026-05-29",
        weightKg: 90.5,
        scales: { adherence: 7, hunger: 6, sleep: 7, energy: 7, mood: 7 },
        measurements: null,
        whatWorked: null,
        whatFailed: null,
        why: null,
        createdAt: "2026-05-29T09:00:00.000Z",
      },
    ];
    const report = buildStudentReport({ ...input, followUps });
    expect(report!.evolution).not.toBeNull();
    expect(report!.evolution!.currentWeight).toBe(90.5);
    // roadmap avança de fase com o acompanhamento
    expect(report!.roadmap.currentPhase).not.toBe("preparation");
  });
});
