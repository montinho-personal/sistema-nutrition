/**
 * Métricas e rótulos qualitativos derivados dos dados do alimento.
 *
 * Funções puras e determinísticas (Documento 08: se existe resposta
 * determinística, é regra — não IA). Base para classificação e alertas.
 */

import {
  ENERGY_DENSITY_THRESHOLDS,
  QUALITATIVE_THRESHOLDS,
  CONFIDENCE_TO_EVIDENCE,
} from "@/modules/foods/constants";
import type { DataConfidence, Food, FoodEvidence, QualitativeLevel } from "@/modules/foods/types";

/** Converte um score 0–100 no nível qualitativo correspondente. */
export function scoreToLevel(score: number | null): QualitativeLevel | null {
  if (score === null || Number.isNaN(score)) return null;
  const clamped = Math.max(0, Math.min(100, score));
  return QUALITATIVE_THRESHOLDS.find((t) => clamped >= t.min)!.level;
}

/** Densidade energética em kcal por grama (kcal por 100 g ÷ 100). */
export function energyDensityPerGram(food: Food): number | null {
  const kcal = food.nutrition.energyKcal;
  if (kcal === null) return null;
  return kcal / 100;
}

/** Nível qualitativo da densidade energética. */
export function energyDensityLevel(food: Food): QualitativeLevel | null {
  const perGram = energyDensityPerGram(food);
  if (perGram === null) return null;
  return ENERGY_DENSITY_THRESHOLDS.find((t) => perGram <= t.maxKcalPerGram)!.level;
}

/**
 * Gramas de proteína por 100 kcal — mede "qualidade proteica por caloria".
 * Retorna Infinity para alimentos proteicos sem calorias declaradas evita-se
 * retornando null quando não há energia.
 */
export function proteinPer100Kcal(food: Food): number | null {
  const { proteinG, energyKcal } = food.nutrition;
  if (proteinG === null || energyKcal === null || energyKcal <= 0) return null;
  return (proteinG / energyKcal) * 100;
}

/** Mapeia a confiança dos dados para nível de evidência científica. */
export function evidenceFromConfidence(confidence: DataConfidence): FoodEvidence {
  return CONFIDENCE_TO_EVIDENCE[confidence];
}
