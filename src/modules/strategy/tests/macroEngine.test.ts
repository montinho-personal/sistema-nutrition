import { describe, expect, it } from "vitest";

import {
  computeEnergyBreakdown,
  computeMacros,
  dailyEnergyDeltaForGoal,
  goalCalorieTarget,
  resolveMacros,
} from "@/modules/strategy/services";
import {
  DEFAULT_MACRO_PARAMS,
  FAT_G_PER_KG,
  GOAL_CALORIES_FLOOR,
  KCAL_PER_GRAM,
  PROTEIN_G_PER_KG,
  VELOCITY_DEFICIT_PCT,
} from "@/modules/strategy/constants/parameters";
import type { MacroContext } from "@/modules/strategy/types";

const MALE: MacroContext = {
  weightKg: 80,
  bodyFatPct: null,
  heightCm: 178,
  ageYears: 30,
  sex: "male",
  activity: "moderado",
  trains: "regular",
};

describe("computeMacros — método do BMR", () => {
  it("usa Mifflin quando há altura/idade/sexo e não há % de gordura", () => {
    const m = computeMacros("weight_loss", "deficit", "moderada", MALE);
    expect(m.bmrMethod).toBe("mifflin");
    // Mifflin homem: 10*80 + 6.25*178 - 5*30 + 5 = 1767.5
    expect(m.bmr).toBe(1768);
  });

  it("usa Katch-McArdle quando há % de gordura", () => {
    const m = computeMacros("weight_loss", "deficit", "moderada", { ...MALE, bodyFatPct: 20 });
    expect(m.bmrMethod).toBe("katch_mcardle");
    // 370 + 21.6 * (80 * 0.8) = 370 + 1382.4 = 1752.4
    expect(m.bmr).toBe(1752);
  });

  it("cai para fallback quando faltam altura/idade/sexo", () => {
    const m = computeMacros("weight_loss", "deficit", "moderada", {
      ...MALE,
      heightCm: null,
      ageYears: null,
      sex: null,
    });
    expect(m.bmrMethod).toBe("fallback");
  });
});

describe("computeMacros — calorias e macros", () => {
  it("déficit reduz as calorias em relação ao TDEE", () => {
    const m = computeMacros("weight_loss", "deficit", "moderada", MALE);
    expect(m.calories).toBeLessThan(m.tdee);
    const expected = Math.round((m.tdee * (1 - VELOCITY_DEFICIT_PCT.moderada)) / 10) * 10;
    expect(m.calories).toBe(expected);
  });

  it("superávit aumenta as calorias em relação ao TDEE", () => {
    const m = computeMacros("hypertrophy", "superavit", "moderada", MALE);
    expect(m.calories).toBeGreaterThan(m.tdee);
  });

  it("proteína e gordura seguem os parâmetros por kg", () => {
    const m = computeMacros("weight_loss", "deficit", "moderada", MALE);
    expect(m.proteinG).toBe(Math.round(PROTEIN_G_PER_KG.weight_loss * MALE.weightKg));
    expect(m.fatG).toBe(Math.round(FAT_G_PER_KG * MALE.weightKg));
  });

  it("os macros fecham (aprox.) as calorias-alvo", () => {
    const m = computeMacros("maintenance", "manutencao", "moderada", MALE);
    const sum = m.proteinKcal + m.fatKcal + m.carbKcal;
    // diferença só pelo arredondamento do carboidrato para grama inteira
    expect(Math.abs(sum - m.calories)).toBeLessThanOrEqual(KCAL_PER_GRAM.carb);
  });

  it("carboidrato nunca fica negativo", () => {
    const m = computeMacros("weight_loss", "deficit", "agressiva", { ...MALE, weightKg: 150 });
    expect(m.carbG).toBeGreaterThanOrEqual(0);
  });

  it("marca manual=false quando não há ajuste do treinador", () => {
    const m = computeMacros("weight_loss", "deficit", "moderada", MALE);
    expect(m.manual).toBe(false);
  });
});

describe("computeMacros — ajuste manual do treinador", () => {
  const override = { calories: 2200, proteinPct: 30, carbPct: 45, fatPct: 25 };

  it("usa as calorias e a divisão percentual informadas", () => {
    const m = computeMacros("weight_loss", "deficit", "moderada", MALE, undefined, override);
    expect(m.manual).toBe(true);
    expect(m.calories).toBe(2200);
    // 30% de 2200 = 660 kcal / 4 = 165 g de proteína
    expect(m.proteinG).toBe(Math.round((2200 * 0.3) / KCAL_PER_GRAM.protein));
    // 45% / 4 = carboidrato; 25% / 9 = gordura
    expect(m.carbG).toBe(Math.round((2200 * 0.45) / KCAL_PER_GRAM.carb));
    expect(m.fatG).toBe(Math.round((2200 * 0.25) / KCAL_PER_GRAM.fat));
  });

  it("os kcal por macro batem com as gramas arredondadas", () => {
    const m = computeMacros("weight_loss", "deficit", "moderada", MALE, undefined, override);
    expect(m.proteinKcal).toBe(m.proteinG * KCAL_PER_GRAM.protein);
    expect(m.carbKcal).toBe(m.carbG * KCAL_PER_GRAM.carb);
    expect(m.fatKcal).toBe(m.fatG * KCAL_PER_GRAM.fat);
  });

  it("preserva BMR/TDEE como referência mesmo no ajuste manual", () => {
    const auto = computeMacros("weight_loss", "deficit", "moderada", MALE);
    const manual = computeMacros("weight_loss", "deficit", "moderada", MALE, undefined, override);
    expect(manual.tdee).toBe(auto.tdee);
    expect(manual.bmr).toBe(auto.bmr);
    expect(manual.justifications.some((j) => j.includes("Ajuste manual"))).toBe(true);
  });
});

describe("computeEnergyBreakdown — gasto energético decomposto", () => {
  it("as partes somam exatamente o total (TDEE)", () => {
    const e = computeEnergyBreakdown(MALE);
    expect(e.bmr + e.dailyActivityKcal + e.trainingKcal).toBe(e.tdee);
  });

  it("quem não treina tem gasto de treino zero", () => {
    const e = computeEnergyBreakdown({ ...MALE, trains: "nao" });
    expect(e.trainingKcal).toBe(0);
    expect(e.bmr + e.dailyActivityKcal).toBe(e.tdee);
  });

  it("treinar regularmente adiciona gasto de treino", () => {
    const noTrain = computeEnergyBreakdown({ ...MALE, trains: "nao" });
    const regular = computeEnergyBreakdown({ ...MALE, trains: "regular" });
    expect(regular.trainingKcal).toBeGreaterThan(0);
    expect(regular.tdee).toBeGreaterThan(noTrain.tdee);
  });

  it("dia a dia mais ativo eleva o gasto de atividades", () => {
    const sed = computeEnergyBreakdown({ ...MALE, activity: "sedentario" });
    const act = computeEnergyBreakdown({ ...MALE, activity: "ativo" });
    expect(act.dailyActivityKcal).toBeGreaterThan(sed.dailyActivityKcal);
  });

  it("o TDEE bate com o do cálculo de macros", () => {
    const e = computeEnergyBreakdown(MALE);
    const m = computeMacros("weight_loss", "deficit", "moderada", MALE);
    expect(e.tdee).toBe(m.tdee);
    expect(e.bmr).toBe(m.bmr);
  });

  it("treino quantificado (dias × duração) refina o gasto e o TDEE", () => {
    const semTreino = computeEnergyBreakdown({ ...MALE, trains: "nao" });
    const comTreino = computeEnergyBreakdown({
      ...MALE,
      trains: "regular",
      trainingDaysPerWeek: 5,
      trainingMinutes: 60,
    });
    expect(comTreino.trainingKcal).toBeGreaterThan(0);
    expect(comTreino.tdee).toBeGreaterThan(semTreino.tdee);
    // As partes seguem somando o total.
    expect(comTreino.bmr + comTreino.dailyActivityKcal + comTreino.trainingKcal).toBe(comTreino.tdee);
    // Macros usam o mesmo TDEE refinado.
    const m = computeMacros("weight_loss", "deficit", "moderada", {
      ...MALE,
      trainingDaysPerWeek: 5,
      trainingMinutes: 60,
    });
    expect(m.tdee).toBe(comTreino.tdee);
  });

  it("mais volume de treino → mais gasto", () => {
    const pouco = computeEnergyBreakdown({ ...MALE, trainingDaysPerWeek: 3, trainingMinutes: 45 });
    const muito = computeEnergyBreakdown({ ...MALE, trainingDaysPerWeek: 6, trainingMinutes: 90 });
    expect(muito.trainingKcal).toBeGreaterThan(pouco.trainingKcal);
    expect(muito.tdee).toBeGreaterThan(pouco.tdee);
  });

  it("sem dias/duração, cai no bônus por frequência (comportamento anterior preservado)", () => {
    const m = computeMacros("weight_loss", "deficit", "moderada", MALE);
    // MALE (80 kg, moderado, treina) sem dado quantificado → TDEE do bônus, como antes.
    expect(m.tdee).toBe(2695);
  });
});

describe("goalCalorieTarget — calorias que perseguem a meta", () => {
  it("déficit = TDEE menos o gasto diário exigido pela meta", () => {
    // 4 kg em 8 semanas = 0.5 kg/semana → 7700*0.5/7 ≈ 550 kcal/dia
    const delta = dailyEnergyDeltaForGoal(4, 8);
    const target = goalCalorieTarget({
      direction: "deficit",
      tdee: 2500,
      targetChangeKg: 4,
      weeks: 8,
    });
    expect(delta).toBe(550);
    expect(target).toBe(Math.round((2500 - 550) / 10) * 10);
  });

  it("superávit soma o gasto diário exigido ao TDEE", () => {
    const target = goalCalorieTarget({
      direction: "superavit",
      tdee: 2500,
      targetChangeKg: 4,
      weeks: 8,
    });
    expect(target).toBeGreaterThan(2500);
  });

  it("respeita o piso de segurança em metas agressivas", () => {
    // 5 kg em 2 semanas exige ~2750 kcal/dia — acima do TDEE, viraria negativo
    const target = goalCalorieTarget({
      direction: "deficit",
      tdee: 2500,
      targetChangeKg: 5,
      weeks: 2,
    });
    expect(target).toBe(GOAL_CALORIES_FLOOR);
  });

  it("retorna null sem meta ou na manutenção", () => {
    expect(goalCalorieTarget({ direction: "deficit", tdee: 2500, targetChangeKg: null, weeks: 8 })).toBeNull();
    expect(goalCalorieTarget({ direction: "manutencao", tdee: 2500, targetChangeKg: 4, weeks: 8 })).toBeNull();
  });
});

describe("resolveMacros — precedência das calorias-alvo", () => {
  const strat = { direction: "deficit" as const, velocity: "moderada" as const };

  it("sem meta nem ajuste: usa a velocidade prescrita (automático)", () => {
    const m = resolveMacros("weight_loss", strat, MALE, DEFAULT_MACRO_PARAMS, {});
    const auto = computeMacros("weight_loss", "deficit", "moderada", MALE);
    expect(m.calories).toBe(auto.calories);
    expect(m.manual).toBe(false);
  });

  it("com meta: o cardápio segue as calorias da meta", () => {
    const m = resolveMacros("weight_loss", strat, MALE, DEFAULT_MACRO_PARAMS, {
      targetChangeKg: 4,
      targetWeeks: 8,
    });
    const target = goalCalorieTarget({
      direction: "deficit",
      tdee: m.tdee,
      targetChangeKg: 4,
      weeks: 8,
    });
    expect(m.calories).toBe(target);
    expect(m.justifications.some((j) => j.includes("definidas pela meta"))).toBe(true);
  });

  it("ajuste manual vence a meta", () => {
    const m = resolveMacros("weight_loss", strat, MALE, DEFAULT_MACRO_PARAMS, {
      targetChangeKg: 4,
      targetWeeks: 8,
      macroOverride: { calories: 1900, proteinPct: 30, carbPct: 45, fatPct: 25 },
    });
    expect(m.manual).toBe(true);
    expect(m.calories).toBe(1900);
  });
});
