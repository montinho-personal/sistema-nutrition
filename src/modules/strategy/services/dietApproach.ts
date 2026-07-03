/**
 * Abordagem alimentar (Workflow V1 — Etapa 4): sugere a mais adequada, resolve a
 * efetiva (escolhida ou sugerida) e redistribui os macros mantendo as calorias.
 * Determinístico (Doc 08). Trocar de abordagem recalcula tudo — sem perder o
 * resto da estratégia.
 */

import {
  DIET_APPROACHES,
  SUGGESTED_APPROACH_BY_GOAL,
} from "@/modules/strategy/constants/dietApproaches";
import { KCAL_PER_GRAM } from "@/modules/strategy/constants/parameters";
import type { StudentGoal } from "@/modules/students/types";
import type { DietApproach, DietApproachId, MacroTargets } from "@/modules/strategy/types";

/** Abordagem sugerida pelo sistema a partir do objetivo. */
export function suggestDietApproach(goal: StudentGoal): DietApproachId {
  return SUGGESTED_APPROACH_BY_GOAL[goal];
}

/** Abordagem efetiva: a escolhida pelo treinador ou, na ausência, a sugerida. */
export function resolveDietApproach(
  chosen: DietApproachId | null | undefined,
  goal: StudentGoal,
): DietApproach {
  const id = chosen ?? suggestDietApproach(goal);
  return DIET_APPROACHES[id];
}

/**
 * Redistribui os macros conforme a abordagem, mantendo as calorias-alvo:
 * - Alta proteína: eleva a proteína; o carboidrato absorve a diferença.
 * - Low carb: limita o carboidrato; a gordura absorve a diferença.
 * - Tradicional/Flexível/Jejum: não mexe nos macros (só nas refeições/liberdade).
 */
export function applyDietApproach(
  base: MacroTargets,
  approach: DietApproach,
  weightKg: number,
): MacroTargets {
  if ((!approach.proteinGPerKg && !approach.carbMaxGPerKg) || weightKg <= 0) return base;

  const { calories } = base;
  let proteinG = base.proteinG;
  let fatG = base.fatG;
  let carbG = base.carbG;
  let note = "";

  if (approach.proteinGPerKg) {
    const target = Math.round(approach.proteinGPerKg * weightKg);
    if (target > proteinG) proteinG = target;
    // Carboidrato absorve a mudança para preservar as calorias.
    carbG = Math.max(
      0,
      Math.round((calories - proteinG * KCAL_PER_GRAM.protein - fatG * KCAL_PER_GRAM.fat) / KCAL_PER_GRAM.carb),
    );
    note = `${approach.label}: proteína elevada para ${approach.proteinGPerKg} g/kg, com o carboidrato ajustado.`;
  }

  if (approach.carbMaxGPerKg) {
    const cap = Math.round(approach.carbMaxGPerKg * weightKg);
    if (carbG > cap) {
      carbG = cap;
      // Gordura absorve as calorias liberadas pelo corte de carboidrato.
      fatG = Math.max(
        0,
        Math.round((calories - proteinG * KCAL_PER_GRAM.protein - carbG * KCAL_PER_GRAM.carb) / KCAL_PER_GRAM.fat),
      );
      note = `${approach.label}: carboidrato limitado a ${approach.carbMaxGPerKg} g/kg, o restante vai para a gordura.`;
    }
  }

  return {
    ...base,
    proteinG,
    fatG,
    carbG,
    proteinKcal: proteinG * KCAL_PER_GRAM.protein,
    fatKcal: fatG * KCAL_PER_GRAM.fat,
    carbKcal: carbG * KCAL_PER_GRAM.carb,
    justifications: note ? [...base.justifications, note] : base.justifications,
  };
}
