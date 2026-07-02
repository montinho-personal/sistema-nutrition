/**
 * Classificação estratégica automática de alimentos (Documento 15).
 *
 * Regra determinística e transparente: combina densidade proteica,
 * saciedade, fibra, densidade energética, processamento e risco de exagero.
 * Sempre devolve as justificativas (Documento 00 — Transparência).
 *
 * A IA não participa desta decisão: é uma regra (Documento 08).
 */

import { CLASSIFICATION_CONFIG as C } from "@/modules/foods/constants";
import type { Food, StrategicAssessment } from "@/modules/foods/types";
import { energyDensityPerGram, proteinPer100Kcal } from "@/modules/foods/services/foodMetrics";

/**
 * Classifica o alimento em: excellent, good, neutral, poor ou
 * context_dependent. Respeita o override manual quando presente.
 */
export function classifyFood(food: Food): StrategicAssessment {
  const override = food.attributes.strategicOverride;
  if (override) {
    return {
      classification: override,
      reasons: ["Classificação definida manualmente pelo profissional."],
      computed: false,
    };
  }

  const reasons: string[] = [];
  const satiety = food.attributes.satietyScore;
  const fiber = food.nutrition.fiberG ?? 0;
  const proteinRatio = proteinPer100Kcal(food);
  const density = energyDensityPerGram(food);
  const processing = food.processingLevel;
  const overeating = food.attributes.overeatingRisk;

  const isUltraProcessed = processing === "ultra_processed";
  const highProtein = proteinRatio !== null && proteinRatio >= C.goodProteinPer100Kcal;
  const highFiber = fiber >= C.highFiberG;
  const highSatiety = satiety !== null && satiety >= C.excellentSatiety;
  const goodSatiety = satiety !== null && satiety >= C.goodSatiety;
  const veryEnergyDense = density !== null && density >= C.contextDependentDensity;
  const highOvereating = overeating === "high";

  // Ultraprocessado nunca é "excelente" — mas não é demonizado (Documento 15).
  if (isUltraProcessed) {
    reasons.push("Ultraprocessado: melhor como escolha ocasional.");
    return { classification: "poor", reasons, computed: true };
  }

  // Muito denso energeticamente (óleos, oleaginosas): depende do contexto.
  if (veryEnergyDense) {
    reasons.push("Alta densidade energética: excelente para ganho de peso, cauteloso no déficit.");
    if (highProtein) reasons.push("Boa densidade proteica por caloria.");
    return { classification: "context_dependent", reasons, computed: true };
  }

  if (highSatiety && (highProtein || highFiber) && !highOvereating) {
    if (highProtein) reasons.push("Alta densidade proteica por caloria.");
    if (highFiber) reasons.push("Rico em fibra.");
    reasons.push("Alta saciedade.");
    return { classification: "excellent", reasons, computed: true };
  }

  if (goodSatiety && !highOvereating) {
    reasons.push("Boa saciedade e perfil equilibrado.");
    if (highProtein) reasons.push("Boa densidade proteica por caloria.");
    if (highFiber) reasons.push("Boa quantidade de fibra.");
    return { classification: "good", reasons, computed: true };
  }

  if (highOvereating) {
    reasons.push("Alta palatabilidade: porção controlada ajuda.");
  }
  reasons.push("Perfil neutro — útil conforme o contexto da estratégia.");
  return { classification: "neutral", reasons, computed: true };
}
