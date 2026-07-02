import { describe, expect, it } from "vitest";

import { DEFAULT_MACRO_PARAMS } from "@/modules/strategy/constants/parameters";
import { computeMacros } from "@/modules/strategy/services";
import type { MacroContext } from "@/modules/strategy/types";
import { resolveMacroParams } from "@/modules/settings/services";

const CTX: MacroContext = {
  weightKg: 80,
  bodyFatPct: null,
  heightCm: 178,
  ageYears: 30,
  sex: "male",
  activity: "moderado",
  trains: "regular",
};

describe("settings — resolveMacroParams", () => {
  it("sem overrides (ambiente sem storage), resolve para os padrões", () => {
    expect(resolveMacroParams()).toEqual(DEFAULT_MACRO_PARAMS);
  });
});

describe("computeMacros — respeita os parâmetros injetados (Configurações)", () => {
  it("proteína g/kg maior aumenta a proteína calculada", () => {
    const base = computeMacros("weight_loss", "deficit", "moderada", CTX);
    const higher = computeMacros("weight_loss", "deficit", "moderada", CTX, {
      ...DEFAULT_MACRO_PARAMS,
      proteinGPerKg: { ...DEFAULT_MACRO_PARAMS.proteinGPerKg, weight_loss: 2.6 },
    });
    expect(higher.proteinG).toBeGreaterThan(base.proteinG);
    expect(higher.proteinG).toBe(Math.round(2.6 * CTX.weightKg));
  });

  it("gordura g/kg configurável muda a gordura calculada", () => {
    const m = computeMacros("weight_loss", "deficit", "moderada", CTX, {
      ...DEFAULT_MACRO_PARAMS,
      fatGPerKg: 1.2,
    });
    expect(m.fatG).toBe(Math.round(1.2 * CTX.weightKg));
  });

  it("déficit configurável muda as calorias-alvo", () => {
    const params = {
      ...DEFAULT_MACRO_PARAMS,
      velocityDeficitPct: { ...DEFAULT_MACRO_PARAMS.velocityDeficitPct, moderada: 0.25 },
    };
    const m = computeMacros("weight_loss", "deficit", "moderada", CTX, params);
    const expected = Math.round((m.tdee * (1 - 0.25)) / 10) * 10;
    expect(m.calories).toBe(expected);
  });

  it("sem parâmetros, usa os padrões (compatível com chamadas antigas)", () => {
    const withDefault = computeMacros("weight_loss", "deficit", "moderada", CTX);
    const explicit = computeMacros("weight_loss", "deficit", "moderada", CTX, DEFAULT_MACRO_PARAMS);
    expect(withDefault).toEqual(explicit);
  });
});
