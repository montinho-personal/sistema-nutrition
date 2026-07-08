import { describe, expect, it } from "vitest";

import { curatedFoods } from "@/modules/foods/data/curatedFoods";
import { buildItemWithGrams } from "@/modules/meal-plan/services";
import {
  PORTION_LIMITS,
  REPLACEMENT_TOLERANCES,
} from "@/modules/meal-plan/constants/parameters";
import {
  buildReplacementComparison,
  generateReplacementWarnings,
  isWithinTolerance,
  rankReplacementCandidates,
} from "@/modules/meal-plan/services/foodSubstitution";
import type { Food } from "@/modules/foods/types";
import type { MacroTotals, MealItem } from "@/modules/meal-plan/types";

function food(id: string): Food {
  const f = curatedFoods.find((x) => x.id === id);
  if (!f) throw new Error(`fixture ausente: ${id}`);
  return f;
}

// Alimentos reais do banco — mesma família proteica, macros bem diferentes
// (Frango 159 kcal/32 g P vs Patinho 219 kcal/36 g P vs Lombo 210 kcal/30 g P
// vs Atum 116 kcal/25,5 g P vs Azeite, sem proteína).
const FRANGO = food("FIE001");
const PATINHO = food("FIE003");
const LOMBO = food("FIE028");
const ATUM = food("FIE005");
const AZEITE = food("FIE019");
const OVO = food("FIE002");

/** Fixture sintética mínima e válida — só para os casos-limite dos dados. */
function buildFoodFixture(overrides: Partial<Food> = {}): Food {
  return {
    id: "TEST",
    name: "Alimento de teste",
    foodGroup: "Testes",
    subgroup: null,
    description: null,
    synonyms: [],
    categoryName: "Testes",
    sourceName: "TESTE",
    sourceCode: "TEST",
    dataConfidence: "estimated",
    processingLevel: "in_natura",
    nutrition: {
      energyKcal: 100,
      proteinG: 10,
      carbsG: 10,
      fatG: 2,
      fiberG: 1,
      sugarG: null,
      saturatedFatG: null,
      sodiumMg: 50,
      potassiumMg: null,
    },
    attributes: {
      satietyScore: 50,
      practicalityScore: 50,
      digestibilityScore: 50,
      palatabilityScore: 50,
      acceptanceScore: 50,
      overeatingRisk: "low",
      costRange: "medium",
      availability: "high",
      prepTimeMinutes: 0,
      freezesWell: false,
      portability: false,
      needsCooking: false,
      canEatCold: true,
      canPrepAhead: false,
      goodForLunchbox: false,
      goodForTravel: false,
      goodForHungerControl: false,
      goodForFewMeals: false,
      bestTimes: ["lunch", "dinner"],
      suitableGoals: ["maintenance"],
      strategicApplications: null,
      strategicOverride: null,
    },
    tags: [],
    portions: [],
    ...overrides,
  };
}

const DAY_TARGET: MacroTotals = { kcal: 2200, protein: 176, carbs: 220, fat: 70 };
// Totais do dia coerentes com o alvo (nem abaixo de proteína, nem perto do teto de gordura).
const DAY_TOTALS_ON_TRACK: MacroTotals = { kcal: 2200, protein: 176, carbs: 220, fat: 70 };

function frangoItem(grams = 150): MealItem {
  return buildItemWithGrams(FRANGO, "protein", grams);
}

describe("Modo 4 — Manter quantidade", () => {
  it("usa exatamente as mesmas gramas do original", () => {
    const original = frangoItem(150);
    const comparison = buildReplacementComparison({
      originalFood: FRANGO,
      originalItem: original,
      replacementFood: PATINHO,
      mode: "match_quantity",
      mealTotals: original,
      dayTotals: DAY_TOTALS_ON_TRACK,
      dayTarget: DAY_TARGET,
      goal: "maintenance",
    });
    expect(comparison.replacementItem.grams).toBe(150);
    // 150 g de patinho tem mais kcal e mais proteína que 150 g de frango —
    // mesmo peso NÃO é mesma caloria nem mesma proteína (a regra central).
    expect(comparison.replacementItem.kcal).not.toBe(original.kcal);
    expect(comparison.delta.kcal).toBeCloseTo(((PATINHO.nutrition.energyKcal! - FRANGO.nutrition.energyKcal!) * 150) / 100, 1);
  });
});

describe("Modo 2 — Manter calorias", () => {
  it("ajusta a quantidade do substituto para bater as calorias originais (±tolerância)", () => {
    const original = frangoItem(150);
    const comparison = buildReplacementComparison({
      originalFood: FRANGO,
      originalItem: original,
      replacementFood: PATINHO,
      mode: "match_calories",
      mealTotals: original,
      dayTotals: DAY_TOTALS_ON_TRACK,
      dayTarget: DAY_TARGET,
      goal: "maintenance",
    });
    // Patinho é mais denso em calorias — a quantidade equivalente é menor.
    expect(comparison.replacementItem.grams).toBeLessThan(150);
    expect(
      (Math.abs(comparison.replacementItem.kcal - original.kcal) / original.kcal) * 100,
    ).toBeLessThanOrEqual(REPLACEMENT_TOLERANCES.caloriePercent + 1); // +1 pela margem do arredondamento em gramas
  });

  it("atum (já drenado nos dados) fecha as calorias sem nenhum ajuste extra de peso", () => {
    const original = frangoItem(150);
    const comparison = buildReplacementComparison({
      originalFood: FRANGO,
      originalItem: original,
      replacementFood: ATUM,
      mode: "match_calories",
      mealTotals: original,
      dayTotals: DAY_TOTALS_ON_TRACK,
      dayTarget: DAY_TARGET,
      goal: "maintenance",
    });
    // Atum é menos denso — precisa de mais gramas para bater a mesma caloria.
    expect(comparison.replacementItem.grams).toBeGreaterThan(150);
    expect(Math.abs(comparison.replacementItem.kcal - original.kcal)).toBeLessThan(15);
  });
});

describe("Modo 3 — Manter proteína", () => {
  it("ajusta a quantidade do substituto para bater a proteína original (±tolerância)", () => {
    const original = frangoItem(150); // 48 g de proteína
    const comparison = buildReplacementComparison({
      originalFood: FRANGO,
      originalItem: original,
      replacementFood: PATINHO,
      mode: "match_protein",
      mealTotals: original,
      dayTotals: DAY_TOTALS_ON_TRACK,
      dayTarget: DAY_TARGET,
      goal: "maintenance",
    });
    expect(
      (Math.abs(comparison.replacementItem.protein - original.protein) / original.protein) * 100,
    ).toBeLessThanOrEqual(REPLACEMENT_TOLERANCES.proteinPercent + 1);
  });

  it("mantendo a proteína, o alerta acusa o ganho de gordura e calorias (nunca finge que está tudo igual)", () => {
    const original = frangoItem(150);
    const comparison = buildReplacementComparison({
      originalFood: FRANGO,
      originalItem: original,
      replacementFood: LOMBO,
      mode: "match_protein",
      mealTotals: original,
      dayTotals: DAY_TOTALS_ON_TRACK,
      dayTarget: DAY_TARGET,
      goal: "maintenance",
    });
    expect(comparison.delta.fat).toBeGreaterThan(0);
    expect(comparison.delta.kcal).toBeGreaterThan(0);
  });
});

describe("Diferenças de macros e arredondamento", () => {
  it("delta = substituto − original, item a item", () => {
    const original = frangoItem(150);
    const comparison = buildReplacementComparison({
      originalFood: FRANGO,
      originalItem: original,
      replacementFood: OVO,
      mode: "match_quantity",
      mealTotals: original,
      dayTotals: DAY_TOTALS_ON_TRACK,
      dayTarget: DAY_TARGET,
      goal: "maintenance",
    });
    expect(comparison.delta.kcal).toBe(comparison.replacementItem.kcal - original.kcal);
    expect(comparison.delta.protein).toBe(comparison.replacementItem.protein - original.protein);
    expect(comparison.delta.carbs).toBe(comparison.replacementItem.carbs - original.carbs);
    expect(comparison.delta.fat).toBe(comparison.replacementItem.fat - original.fat);
  });

  it("a quantidade sugerida é sempre um número inteiro de gramas", () => {
    for (const mode of ["smart", "match_calories", "match_protein", "match_quantity"] as const) {
      const comparison = buildReplacementComparison({
        originalFood: FRANGO,
        originalItem: frangoItem(137),
        replacementFood: PATINHO,
        mode,
        mealTotals: frangoItem(137),
        dayTotals: DAY_TOTALS_ON_TRACK,
        dayTarget: DAY_TARGET,
        goal: "weight_loss",
      });
      expect(Number.isInteger(comparison.replacementItem.grams)).toBe(true);
    }
  });
});

describe("Tolerâncias (isWithinTolerance)", () => {
  it("dentro da tolerância → true; fora → false", () => {
    const original = frangoItem(150);
    const closeDelta: MacroTotals = { kcal: 2, protein: 1, carbs: 0, fat: 0 };
    const farDelta: MacroTotals = { kcal: 80, protein: 20, carbs: 0, fat: 0 };
    expect(isWithinTolerance(closeDelta, original)).toBe(true);
    expect(isWithinTolerance(farDelta, original)).toBe(false);
  });
});

describe("Casos especiais — nunca NaN, nunca Infinity, sempre um número seguro", () => {
  it("substituto com proteína zero, no modo 'manter proteína' → cai no piso do papel", () => {
    const original = frangoItem(150);
    const comparison = buildReplacementComparison({
      originalFood: FRANGO,
      originalItem: original,
      replacementFood: AZEITE, // proteína 0 — não pode gerar Infinity
      mode: "match_protein",
      mealTotals: original,
      dayTotals: DAY_TOTALS_ON_TRACK,
      dayTarget: DAY_TARGET,
      goal: "maintenance",
    });
    expect(Number.isFinite(comparison.replacementItem.grams)).toBe(true);
    expect(comparison.replacementItem.grams).toBe(PORTION_LIMITS.protein.min);
    // A proteína despenca — o alerta tem que dizer isso, nunca esconder.
    expect(comparison.warnings.some((w) => w.level === "high_impact")).toBe(true);
  });

  it("substituto com kcal zero, no modo 'manter calorias' → cai no piso do papel", () => {
    const zeroKcalFood = buildFoodFixture({
      id: "ZERO_KCAL",
      nutrition: { energyKcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0, sugarG: null, saturatedFatG: null, sodiumMg: null, potassiumMg: null },
    });
    const original = frangoItem(150);
    const comparison = buildReplacementComparison({
      originalFood: FRANGO,
      originalItem: original,
      replacementFood: zeroKcalFood,
      mode: "match_calories",
      mealTotals: original,
      dayTotals: DAY_TOTALS_ON_TRACK,
      dayTarget: DAY_TARGET,
      goal: "maintenance",
    });
    expect(Number.isFinite(comparison.replacementItem.grams)).toBe(true);
    expect(comparison.replacementItem.grams).toBe(PORTION_LIMITS.protein.min);
  });

  it("nutrientes nulos no substituto nunca geram NaN em nenhum modo", () => {
    const nullNutritionFood = buildFoodFixture({
      id: "NULL_NUTRI",
      nutrition: { energyKcal: null, proteinG: null, carbsG: null, fatG: null, fiberG: null, sugarG: null, saturatedFatG: null, sodiumMg: null, potassiumMg: null },
    });
    const original = frangoItem(150);
    for (const mode of ["smart", "match_calories", "match_protein", "match_quantity"] as const) {
      const comparison = buildReplacementComparison({
        originalFood: FRANGO,
        originalItem: original,
        replacementFood: nullNutritionFood,
        mode,
        mealTotals: original,
        dayTotals: DAY_TOTALS_ON_TRACK,
        dayTarget: DAY_TARGET,
        goal: "hypertrophy",
      });
      expect(Number.isFinite(comparison.replacementItem.grams)).toBe(true);
      expect(Number.isFinite(comparison.replacementItem.kcal)).toBe(true);
      expect(Number.isNaN(comparison.replacementItem.kcal)).toBe(false);
    }
  });

  it("gramas manuais zero, negativas ou não numéricas nunca quebram — mínimo de 1 g", () => {
    const original = frangoItem(150);
    for (const manualGrams of [0, -50, Number.NaN]) {
      const comparison = buildReplacementComparison({
        originalFood: FRANGO,
        originalItem: original,
        replacementFood: PATINHO,
        mode: "match_quantity",
        mealTotals: original,
        dayTotals: DAY_TOTALS_ON_TRACK,
        dayTarget: DAY_TARGET,
        goal: "maintenance",
        manualGrams,
      });
      expect(comparison.replacementItem.grams).toBeGreaterThanOrEqual(1);
      expect(Number.isFinite(comparison.replacementItem.grams)).toBe(true);
    }
  });

  it("alimento sem alvo diário definido (zero) não gera alerta de % por divisão por zero", () => {
    const zeroTarget: MacroTotals = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    const warnings = generateReplacementWarnings({
      delta: { kcal: 50, protein: -2, carbs: 0, fat: 3 },
      dayTarget: zeroTarget,
      sodiumDelta: 0,
    });
    expect(warnings.every((w) => Number.isFinite(w.message.length))).toBe(true);
    expect(warnings.length).toBeGreaterThan(0);
  });
});

describe("Alertas inteligentes — sempre avaliam impacto absoluto E percentual", () => {
  it("troca próxima → um único INFO", () => {
    const warnings = generateReplacementWarnings({
      delta: { kcal: 3, protein: 0.5, carbs: 0, fat: 0.5 },
      dayTarget: DAY_TARGET,
      sodiumDelta: 10,
    });
    expect(warnings).toHaveLength(1);
    expect(warnings[0].level).toBe("info");
  });

  it("+150 kcal numa dieta de 1.500 kcal pesa mais (alto impacto) que na de 3.500 (atenção/nada)", () => {
    const tightDiet: MacroTotals = { kcal: 1500, protein: 120, carbs: 150, fat: 45 };
    const looseDiet: MacroTotals = { kcal: 3500, protein: 200, carbs: 400, fat: 100 };
    const delta: MacroTotals = { kcal: 150, protein: 0, carbs: 0, fat: 0 };

    const tightWarnings = generateReplacementWarnings({ delta, dayTarget: tightDiet, sodiumDelta: 0 });
    const looseWarnings = generateReplacementWarnings({ delta, dayTarget: looseDiet, sodiumDelta: 0 });

    expect(tightWarnings.some((w) => w.level === "high_impact")).toBe(true);
    expect(looseWarnings.some((w) => w.level === "high_impact")).toBe(false);
  });

  it("queda grande de proteína do dia → alto impacto, sempre com o número exato", () => {
    const warnings = generateReplacementWarnings({
      delta: { kcal: 0, protein: -20, carbs: 0, fat: 0 },
      dayTarget: DAY_TARGET,
      sodiumDelta: 0,
    });
    const risk = warnings.find((w) => w.level === "high_impact");
    expect(risk?.message).toContain("20");
  });

  it("aumento de gordura da refeição gera o alerta no texto esperado pelo treinador", () => {
    const warnings = generateReplacementWarnings({
      delta: { kcal: 20, protein: 0, carbs: 0, fat: 13 },
      dayTarget: DAY_TARGET,
      sodiumDelta: 0,
    });
    expect(warnings.some((w) => w.message.includes("aumenta a gordura da refeição"))).toBe(true);
  });
});

describe("Impacto na refeição e no dia", () => {
  it("mealAfter reflete a troca; totais dos outros itens da refeição não mudam", () => {
    const original = frangoItem(150);
    const mealTotals: MacroTotals = { kcal: original.kcal + 200, protein: original.protein + 5, carbs: 40, fat: 10 };
    const comparison = buildReplacementComparison({
      originalFood: FRANGO,
      originalItem: original,
      replacementFood: PATINHO,
      mode: "match_quantity",
      mealTotals,
      dayTotals: DAY_TOTALS_ON_TRACK,
      dayTarget: DAY_TARGET,
      goal: "maintenance",
    });
    expect(comparison.mealAfter.kcal).toBeCloseTo(mealTotals.kcal - original.kcal + comparison.replacementItem.kcal, 5);
  });

  it("dayAfter soma exatamente o delta do item ao dia inteiro", () => {
    const original = frangoItem(150);
    const comparison = buildReplacementComparison({
      originalFood: FRANGO,
      originalItem: original,
      replacementFood: PATINHO,
      mode: "match_quantity",
      mealTotals: original,
      dayTotals: DAY_TOTALS_ON_TRACK,
      dayTarget: DAY_TARGET,
      goal: "maintenance",
    });
    expect(comparison.dayAfter.kcal).toBeCloseTo(DAY_TOTALS_ON_TRACK.kcal + comparison.delta.kcal, 5);
    expect(comparison.dayAfter.protein).toBeCloseTo(DAY_TOTALS_ON_TRACK.protein + comparison.delta.protein, 5);
  });
});

describe("Decisão explicada (Nutrition Decision Engine) — nunca contradiz os números", () => {
  it("o headline cita exatamente as gramas e os alimentos calculados", () => {
    const original = frangoItem(150);
    const comparison = buildReplacementComparison({
      originalFood: FRANGO,
      originalItem: original,
      replacementFood: ATUM,
      mode: "match_calories",
      mealTotals: original,
      dayTotals: DAY_TOTALS_ON_TRACK,
      dayTarget: DAY_TARGET,
      goal: "weight_loss",
    });
    expect(comparison.decision.headline).toContain(`${comparison.replacementItem.grams} g`);
    expect(comparison.decision.headline).toContain("Atum");
    expect(comparison.decision.headline).toContain(`${original.grams} g`);
  });

  it("o risco só aparece quando há um alerta de atenção/alto impacto — nunca inventado", () => {
    const original = frangoItem(150);
    const comparison = buildReplacementComparison({
      originalFood: FRANGO,
      originalItem: original,
      replacementFood: OVO,
      mode: "match_calories",
      mealTotals: original,
      dayTotals: DAY_TOTALS_ON_TRACK,
      dayTarget: DAY_TARGET,
      goal: "maintenance",
    });
    const hasRealWarning = comparison.warnings.some((w) => w.level !== "info");
    expect(comparison.decision.risk !== null).toBe(hasRealWarning);
    expect(comparison.decision.alternative !== null).toBe(hasRealWarning);
  });
});

describe("Ranking inteligente de candidatos", () => {
  it("nunca inclui o próprio alimento original, só o mesmo papel, ordenado por score", () => {
    const original = frangoItem(150);
    const candidates = rankReplacementCandidates({
      originalFood: FRANGO,
      originalItem: original,
      foods: curatedFoods,
      restrictions: [],
      goal: "weight_loss",
      dayTotals: DAY_TOTALS_ON_TRACK,
      dayTarget: DAY_TARGET,
    });
    expect(candidates.some((c) => c.food.id === FRANGO.id)).toBe(false);
    expect(candidates.every((c) => c.item.role === "protein")).toBe(true);
    for (let i = 1; i < candidates.length; i++) {
      expect(candidates[i - 1].score).toBeGreaterThanOrEqual(candidates[i].score);
    }
    expect(candidates.length).toBeGreaterThan(0);
  });

  it("respeita o limite pedido", () => {
    const candidates = rankReplacementCandidates({
      originalFood: FRANGO,
      originalItem: frangoItem(150),
      foods: curatedFoods,
      restrictions: [],
      goal: "maintenance",
      dayTotals: DAY_TOTALS_ON_TRACK,
      dayTarget: DAY_TARGET,
      limit: 3,
    });
    expect(candidates.length).toBeLessThanOrEqual(3);
  });

  it("respeita restrições alimentares (ex.: vegano nunca sugere carne)", () => {
    const candidates = rankReplacementCandidates({
      originalFood: FRANGO,
      originalItem: frangoItem(150),
      foods: curatedFoods,
      restrictions: ["vegano"],
      goal: "maintenance",
      dayTotals: DAY_TOTALS_ON_TRACK,
      dayTarget: DAY_TARGET,
    });
    expect(candidates.every((c) => c.food.id !== PATINHO.id && c.food.id !== LOMBO.id)).toBe(true);
  });
});

describe("Recomendação Inteligente por objetivo (Modo 1)", () => {
  // Ground truth determinística: as âncoras que os modos 2 e 3 já calculam.
  function anchors(replacementFood: Food) {
    const original = frangoItem(150);
    const gCal = buildReplacementComparison({
      originalFood: FRANGO,
      originalItem: original,
      replacementFood,
      mode: "match_calories",
      mealTotals: original,
      dayTotals: DAY_TOTALS_ON_TRACK,
      dayTarget: DAY_TARGET,
      goal: "maintenance",
    }).replacementItem.grams;
    const gProt = buildReplacementComparison({
      originalFood: FRANGO,
      originalItem: original,
      replacementFood,
      mode: "match_protein",
      mealTotals: original,
      dayTotals: DAY_TOTALS_ON_TRACK,
      dayTarget: DAY_TARGET,
      goal: "maintenance",
    }).replacementItem.grams;
    return { gCal, gProt };
  }

  function smartGramsFor(goal: "weight_loss" | "hypertrophy" | "recomposition", replacementFood: Food) {
    const original = frangoItem(150);
    return buildReplacementComparison({
      originalFood: FRANGO,
      originalItem: original,
      replacementFood,
      mode: "smart",
      mealTotals: original,
      dayTotals: DAY_TOTALS_ON_TRACK,
      dayTarget: DAY_TARGET,
      goal,
    }).replacementItem.grams;
  }

  it("emagrecimento: a recomendação fica entre a âncora calórica e a proteica", () => {
    const { gCal, gProt } = anchors(PATINHO);
    const smart = smartGramsFor("weight_loss", PATINHO);
    expect(smart).toBeGreaterThanOrEqual(Math.min(gCal, gProt) - 1);
    expect(smart).toBeLessThanOrEqual(Math.max(gCal, gProt) + 1);
  });

  it("hipertrofia prioriza mais a proteína do que emagrecimento — fica mais perto da âncora proteica", () => {
    const { gProt } = anchors(PATINHO);
    const weightLoss = smartGramsFor("weight_loss", PATINHO);
    const hypertrophy = smartGramsFor("hypertrophy", PATINHO);
    expect(Math.abs(hypertrophy - gProt)).toBeLessThanOrEqual(Math.abs(weightLoss - gProt));
  });

  it("recomposição corporal fica entre emagrecimento e hipertrofia (perfil equilibrado)", () => {
    const weightLoss = smartGramsFor("weight_loss", PATINHO);
    const hypertrophy = smartGramsFor("hypertrophy", PATINHO);
    const recomposition = smartGramsFor("recomposition", PATINHO);
    const lo = Math.min(weightLoss, hypertrophy);
    const hi = Math.max(weightLoss, hypertrophy);
    expect(recomposition).toBeGreaterThanOrEqual(lo - 1);
    expect(recomposition).toBeLessThanOrEqual(hi + 1);
  });

  it("se a proteína do dia já está abaixo do alvo, a recomendação nunca fica abaixo da âncora proteica", () => {
    const original = frangoItem(150);
    const proteinBelowTarget: MacroTotals = { ...DAY_TARGET, protein: DAY_TARGET.protein - 30 };
    const { gProt } = anchors(PATINHO);
    const comparison = buildReplacementComparison({
      originalFood: FRANGO,
      originalItem: original,
      replacementFood: PATINHO,
      mode: "smart",
      mealTotals: original,
      dayTotals: proteinBelowTarget,
      dayTarget: DAY_TARGET,
      goal: "weight_loss",
    });
    expect(comparison.replacementItem.grams).toBeGreaterThanOrEqual(gProt - 1);
  });

  it("se a gordura do dia já está no teto e o substituto é mais gorduroso, não passa da âncora calórica", () => {
    const original = frangoItem(150);
    const fatNearTarget: MacroTotals = { ...DAY_TARGET, fat: DAY_TARGET.fat };
    const { gCal } = anchors(LOMBO); // lombo é mais gorduroso que frango
    const comparison = buildReplacementComparison({
      originalFood: FRANGO,
      originalItem: original,
      replacementFood: LOMBO,
      mode: "smart",
      mealTotals: original,
      dayTotals: fatNearTarget,
      dayTarget: DAY_TARGET,
      goal: "maintenance",
    });
    expect(comparison.replacementItem.grams).toBeLessThanOrEqual(gCal + 1);
  });
});
