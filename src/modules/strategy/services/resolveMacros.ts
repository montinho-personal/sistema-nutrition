/**
 * Resolução dos macros de um aluno — uma única fonte de verdade para a
 * precedência das calorias-alvo, usada tanto na Estratégia quanto no Plano
 * Alimentar (para nunca divergirem):
 *
 *   1. Ajuste manual do treinador (calorias + % de macros) — vence tudo.
 *   2. Meta da Definição Estratégica (kg em X semanas) — o cardápio segue a meta.
 *   3. Velocidade prescrita pela estratégia — padrão automático.
 */

import { computeMacros } from "@/modules/strategy/services/macroEngine";
import { goalCalorieTarget } from "@/modules/strategy/services/goalProjection";
import type { StudentGoal } from "@/modules/students/types";
import type {
  MacroContext,
  MacroParams,
  MacroTargets,
  NutritionStrategy,
  StrategyInput,
} from "@/modules/strategy/types";

export function resolveMacros(
  goal: StudentGoal,
  strategy: Pick<NutritionStrategy, "direction" | "velocity">,
  ctx: MacroContext,
  params: MacroParams,
  input: Pick<StrategyInput, "macroOverride" | "targetChangeKg" | "targetWeeks">,
): MacroTargets {
  const override = input.macroOverride ?? null;

  // Calorias derivadas da meta só entram quando não há ajuste manual.
  let caloriesTarget: number | null = null;
  if (!override) {
    // O TDEE não depende das calorias-alvo; um cálculo base o fornece.
    const base = computeMacros(goal, strategy.direction, strategy.velocity, ctx, params);
    caloriesTarget = goalCalorieTarget({
      direction: strategy.direction,
      tdee: base.tdee,
      targetChangeKg: input.targetChangeKg ?? null,
      weeks: input.targetWeeks ?? null,
    });
  }

  return computeMacros(
    goal,
    strategy.direction,
    strategy.velocity,
    ctx,
    params,
    override,
    caloriesTarget,
  );
}
