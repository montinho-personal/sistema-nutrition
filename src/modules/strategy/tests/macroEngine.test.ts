import { describe, expect, it } from "vitest";

import { computeMacros } from "@/modules/strategy/services";
import {
  FAT_G_PER_KG,
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
});
