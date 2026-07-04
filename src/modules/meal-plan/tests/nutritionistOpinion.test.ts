import { describe, expect, it } from "vitest";

import { curatedFoods } from "@/modules/foods/data/curatedFoods";
import {
  ageFromBirthDate,
  buildExecutiveSummary,
  computeScoreMap,
  extractHabitualFoodIds,
  readTrainingContext,
} from "@/modules/diagnosis/services";
import {
  buildStrategy,
  computeEnergyBreakdown,
  evaluateStrategyAlerts,
  projectGoal,
  resolveDietApproach,
  resolveMacros,
} from "@/modules/strategy/services";
import { DEFAULT_MACRO_PARAMS, SCORE_THRESHOLDS } from "@/modules/strategy/constants/parameters";
import { STUDENT_GOAL_LABELS } from "@/modules/students/constants";
import { buildMealPlan, emptyDirective, parseDirective } from "@/modules/meal-plan/services";
import {
  buildNutritionistOpinion,
  type NutritionistOpinionInput,
} from "@/modules/meal-plan/services/nutritionistOpinion";
import type { AnswerMap } from "@/modules/diagnosis/types";
import type { MacroContext, StrategyInput } from "@/modules/strategy/types";
import type { Student } from "@/modules/students/types";

const student: Student = {
  id: "s1",
  fullName: "Rafael Montenegro",
  sex: "male",
  birthDate: "1990-05-10",
  heightCm: 178,
  mainGoal: "weight_loss",
  email: null,
  phone: null,
  notes: null,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

const answers: AnswerMap = {
  objetivo: "weight_loss",
  trains: "regular",
  training_days_per_week: 4,
  training_duration: 60,
  activity: "moderado",
  breakfast: "pão com ovo",
  lunch: "arroz, feijão e frango",
  snacks: "banana",
  favorite_foods: "frango, arroz, feijão, ovos, banana",
  hunger_level: "alto",
  follows_diet: "nao",
};

const input: StrategyInput = {
  currentWeightKg: 88,
  bodyFatPct: 22,
  targetChangeKg: 6,
  targetWeeks: 12,
  macroOverride: null,
  dietApproach: null,
};

function assemble(directiveText = ""): NutritionistOpinionInput {
  const goal = "weight_loss";
  const ageYears = ageFromBirthDate(student.birthDate);
  const goalLabel = STUDENT_GOAL_LABELS[goal];
  const scores = computeScoreMap(answers);
  const strategy = buildStrategy(goal, scores, answers);
  const macroCtx: MacroContext = {
    weightKg: input.currentWeightKg,
    bodyFatPct: input.bodyFatPct,
    heightCm: student.heightCm,
    ageYears,
    sex: student.sex,
    activity: "moderado",
    trains: "regular",
    ...readTrainingContext(answers),
  };
  const macros = resolveMacros(goal, strategy, macroCtx, DEFAULT_MACRO_PARAMS, input);
  const energy = computeEnergyBreakdown(macroCtx);
  const directive = directiveText ? parseDirective(directiveText) : emptyDirective();
  const plan = buildMealPlan(curatedFoods, {
    goal,
    mealsPerDay: strategy.mealsPerDay,
    macros: { kcal: macros.calories, protein: macros.proteinG, carbs: macros.carbG, fat: macros.fatG },
    emphasizeSatiety: scores.hungerControl <= SCORE_THRESHOLDS.low,
    emphasizePracticality: scores.practicality <= SCORE_THRESHOLDS.low,
    budgetTight: false,
    restrictions: [],
    variant: 0,
    habitualFoodIds: extractHabitualFoodIds(answers),
  });
  const habitualIds = new Set(extractHabitualFoodIds(answers));
  const planFoodIds = new Set(plan.meals.flatMap((m) => m.items.map((it) => it.foodId)));

  return {
    student,
    goalLabel,
    weightKg: input.currentWeightKg,
    strategy,
    dietApproachLabel: resolveDietApproach(null, goal).label,
    macros,
    energy,
    projection: projectGoal({
      currentWeightKg: input.currentWeightKg,
      targetChangeKg: input.targetChangeKg!,
      weeks: input.targetWeeks!,
      direction: strategy.direction,
      velocity: strategy.velocity,
      tdee: macros.tdee,
      prescribedDeltaPct: DEFAULT_MACRO_PARAMS.velocityDeficitPct[strategy.velocity],
      trainsRegularly: true,
      proteinAdequate: DEFAULT_MACRO_PARAMS.proteinGPerKg[goal] >= 1.6,
      capacity: scores.adherence + scores.consistency - scores.abandonmentRisk,
    }),
    summary: buildExecutiveSummary(answers, { goalLabel, ageYears }),
    alerts: evaluateStrategyAlerts({
      calories: macros.calories,
      proteinG: macros.proteinG,
      fatG: macros.fatG,
      tdee: macros.tdee,
      weightKg: input.currentWeightKg,
      direction: strategy.direction,
      trainsRegularly: true,
    }),
    plan,
    scores,
    directive,
    restrictions: [],
    habitualInPlan: [...habitualIds].filter((id) => planFoodIds.has(id)).length,
    trainsRegularly: true,
    emphasizeSatiety: scores.hungerControl <= SCORE_THRESHOLDS.low,
    emphasizePracticality: scores.practicality <= SCORE_THRESHOLDS.low,
    budgetTight: false,
  };
}

describe("buildNutritionistOpinion — parecer individualizado", () => {
  it("a manchete traz o nome e o objetivo do aluno", () => {
    const op = buildNutritionistOpinion(assemble());
    expect(op.headline).toContain("Rafael");
    expect(op.headline.toLowerCase()).toContain("emagrecimento");
    expect(op.headline).toContain("kcal");
  });

  it("a estratégia decompõe o gasto energético (TMB + treino + atividades)", () => {
    const op = buildNutritionistOpinion(assemble());
    const joined = op.strategyRationale.join(" ").toLowerCase();
    expect(joined).toContain("metabolismo basal");
    expect(joined).toContain("treino");
    expect(joined).toMatch(/déficit|superávit/);
    expect(joined).toContain("g/kg"); // proteína por kg
  });

  it("o cardápio justifica hábitos e o fechamento de macros", () => {
    const op = buildNutritionistOpinion(assemble());
    const joined = op.menuRationale.join(" ");
    expect(joined.toLowerCase()).toMatch(/já come|acessíveis/);
    expect(joined).toContain("%"); // fechamento em %
  });

  it("a checklist 'o que respeita' cobre objetivo, treino e preferências", () => {
    const op = buildNutritionistOpinion(assemble());
    const labels = op.respects.map((c) => c.label);
    expect(labels).toEqual(
      expect.arrayContaining(["Objetivo", "Treino", "Preferências e hábitos"]),
    );
  });

  it("todo risco vem com solução (Documento 02)", () => {
    const op = buildNutritionistOpinion(assemble());
    for (const r of op.risks) {
      expect(r.solution.trim().length).toBeGreaterThan(0);
    }
  });

  it("a instrução do treinador aparece na justificativa do cardápio", () => {
    const op = buildNutritionistOpinion(assemble("mais barato"));
    expect(op.menuRationale.join(" ")).toContain("dieta barata");
  });

  it("sempre há próximos passos", () => {
    expect(buildNutritionistOpinion(assemble()).nextSteps.length).toBeGreaterThan(0);
  });
});
