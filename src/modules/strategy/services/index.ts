/** Serviços do Módulo de Estratégia (Documento 04 — SPE + Macros). */

export { buildStrategy } from "./strategyEngine";
export { computeMacros, computeEnergyBreakdown } from "./macroEngine";
export { resolveMacros } from "./resolveMacros";
export { projectGoal, goalCalorieTarget, dailyEnergyDeltaForGoal } from "./goalProjection";
export { getStrategyRecord, saveStrategyInput } from "./strategyRepository";
