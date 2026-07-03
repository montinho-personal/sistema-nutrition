import { describe, expect, it } from "vitest";

import {
  applyDietApproach,
  resolveDietApproach,
  suggestDietApproach,
} from "@/modules/strategy/services";
import { DIET_APPROACHES } from "@/modules/strategy/constants/dietApproaches";
import { KCAL_PER_GRAM } from "@/modules/strategy/constants/parameters";
import type { MacroTargets } from "@/modules/strategy/types";

const base: MacroTargets = {
  bmr: 1787,
  bmrMethod: "mifflin",
  activityFactor: 1.5,
  tdee: 2725,
  calories: 2070,
  proteinG: 164,
  fatG: 66,
  carbG: 205,
  proteinKcal: 656,
  fatKcal: 594,
  carbKcal: 820,
  justifications: ["base"],
  manual: false,
};
const WEIGHT = 82;

const totalKcal = (m: MacroTargets) =>
  m.proteinG * KCAL_PER_GRAM.protein + m.carbG * KCAL_PER_GRAM.carb + m.fatG * KCAL_PER_GRAM.fat;

describe("abordagem alimentar — sugestão e resolução", () => {
  it("sugere por objetivo e resolve escolhida vs sugerida", () => {
    expect(suggestDietApproach("hypertrophy")).toBe("alta_proteina");
    expect(suggestDietApproach("weight_loss")).toBe("flexivel");
    // escolhida vence a sugestão
    expect(resolveDietApproach("low_carb", "weight_loss").id).toBe("low_carb");
    // sem escolha → sugerida
    expect(resolveDietApproach(null, "hypertrophy").id).toBe("alta_proteina");
  });
});

describe("abordagem alimentar — redistribuição dos macros", () => {
  it("tradicional/flexível/jejum não mexem nos macros", () => {
    for (const id of ["tradicional", "flexivel", "jejum"] as const) {
      const out = applyDietApproach(base, DIET_APPROACHES[id], WEIGHT);
      expect(out.proteinG).toBe(base.proteinG);
      expect(out.carbG).toBe(base.carbG);
      expect(out.fatG).toBe(base.fatG);
    }
  });

  it("low carb corta o carboidrato e sobe a gordura, mantendo as calorias", () => {
    const out = applyDietApproach(base, DIET_APPROACHES.low_carb, WEIGHT);
    expect(out.carbG).toBeLessThan(base.carbG);
    expect(out.carbG).toBeLessThanOrEqual(Math.round(1.5 * WEIGHT));
    expect(out.fatG).toBeGreaterThan(base.fatG);
    expect(Math.abs(totalKcal(out) - base.calories)).toBeLessThanOrEqual(KCAL_PER_GRAM.fat);
  });

  it("alta proteína sobe a proteína e ajusta o carboidrato, mantendo as calorias", () => {
    const out = applyDietApproach(base, DIET_APPROACHES.alta_proteina, WEIGHT);
    expect(out.proteinG).toBe(Math.round(2.4 * WEIGHT));
    expect(out.proteinG).toBeGreaterThan(base.proteinG);
    expect(out.carbG).toBeLessThan(base.carbG);
    expect(Math.abs(totalKcal(out) - base.calories)).toBeLessThanOrEqual(KCAL_PER_GRAM.carb);
  });

  it("jejum sugere menos refeições (concentra a janela)", () => {
    expect(DIET_APPROACHES.jejum.meals).toBe(3);
  });
});
