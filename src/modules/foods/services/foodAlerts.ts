/**
 * Motor de alertas contextuais (Documento 15).
 *
 * Sempre orienta — nunca apenas avisa, nunca demoniza alimentos
 * (Documento 02 — riscos sempre acompanhados de solução).
 */

import { CLASSIFICATION_CONFIG as C } from "@/modules/foods/constants";
import type { Food, FoodAlert } from "@/modules/foods/types";
import { proteinPer100Kcal } from "@/modules/foods/services/foodMetrics";

/** Gera os alertas relevantes para um alimento, com orientação. */
export function buildFoodAlerts(food: Food): FoodAlert[] {
  const alerts: FoodAlert[] = [];
  const proteinRatio = proteinPer100Kcal(food);
  const satiety = food.attributes.satietyScore;
  const sodium = food.nutrition.sodiumMg;
  const fatG = food.nutrition.fatG ?? 0;
  const fiberG = food.nutrition.fiberG ?? 0;

  // Baixa proteína: só alerta quando não é claramente uma gordura ou hortaliça
  // (onde baixa proteína é esperado e não é um problema).
  const isFatSource = fatG >= 40;
  const isVegetable = (food.nutrition.energyKcal ?? 0) <= 50 && fiberG >= 2;
  if (
    proteinRatio !== null &&
    proteinRatio < C.lowProteinPer100Kcal &&
    !isFatSource &&
    !isVegetable
  ) {
    alerts.push({
      kind: "low_protein",
      message: "Baixa proteína por caloria.",
      guidance: "Combine com uma fonte proteica para equilibrar a refeição.",
      severity: "info",
    });
  }

  if (sodium !== null && sodium >= C.highSodiumMg) {
    alerts.push({
      kind: "high_sodium",
      message: `Sódio elevado (${Math.round(sodium)} mg / 100 g).`,
      guidance: "Controle a quantidade e prefira temperos naturais no restante do dia.",
      severity: "attention",
    });
  }

  if (food.processingLevel === "ultra_processed") {
    alerts.push({
      kind: "ultra_processed",
      message: "Alimento ultraprocessado.",
      guidance: "Ótimo como escolha ocasional; priorize versões in natura no dia a dia.",
      severity: "info",
    });
  }

  if (satiety !== null && satiety < C.lowSatietyAlert) {
    alerts.push({
      kind: "low_satiety",
      message: "Baixa saciedade.",
      guidance: "Combine com fibra ou proteína para aumentar a saciedade da refeição.",
      severity: "info",
    });
  }

  if (food.attributes.overeatingRisk === "high") {
    alerts.push({
      kind: "overeating_risk",
      message: "Alta palatabilidade.",
      guidance: "Porcionar antecipadamente reduz o risco de exagero.",
      severity: "info",
    });
  }

  return alerts;
}
