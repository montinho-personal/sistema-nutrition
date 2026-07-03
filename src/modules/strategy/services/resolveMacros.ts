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
import { applyDietApproach, resolveDietApproach } from "@/modules/strategy/services/dietApproach";
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
  input: Pick<StrategyInput, "macroOverride" | "targetChangeKg" | "targetWeeks" | "dietApproach">,
): MacroTargets {
  const override = input.macroOverride ?? null;

  // Ajuste manual vence tudo — a abordagem alimentar não reescreve números que o
  // treinador definiu à mão.
  if (override) {
    return computeMacros(goal, strategy.direction, strategy.velocity, ctx, params, override);
  }

  // Calorias derivadas da meta (Definição Estratégica), quando houver.
  const base = computeMacros(goal, strategy.direction, strategy.velocity, ctx, params);
  const caloriesTarget = goalCalorieTarget({
    direction: strategy.direction,
    tdee: base.tdee,
    targetChangeKg: input.targetChangeKg ?? null,
    weeks: input.targetWeeks ?? null,
  });

  const macros = computeMacros(
    goal,
    strategy.direction,
    strategy.velocity,
    ctx,
    params,
    null,
    caloriesTarget,
  );

  // Abordagem alimentar redistribui os macros mantendo as calorias.
  const approach = resolveDietApproach(input.dietApproach ?? null, goal);
  return applyDietApproach(macros, approach, ctx.weightKg);
}
