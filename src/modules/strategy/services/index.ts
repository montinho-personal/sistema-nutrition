/** Serviços do Módulo de Estratégia (Documento 04 — SPE + Macros). */

export { buildStrategy } from "./strategyEngine";
export { computeMacros, computeEnergyBreakdown } from "./macroEngine";
export { resolveMacros } from "./resolveMacros";
export {
  suggestDietApproach,
  resolveDietApproach,
  applyDietApproach,
} from "./dietApproach";
export {
  evaluateStrategyAlerts,
  type StrategyAlert,
  type StrategyAlertInput,
  type AlertLevel,
} from "./strategyAlerts";
export { projectGoal, goalCalorieTarget, dailyEnergyDeltaForGoal } from "./goalProjection";
export { getStrategyRecord, saveStrategyInput } from "./strategyRepository";
