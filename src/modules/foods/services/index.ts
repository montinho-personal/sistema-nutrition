/** Serviços do Food Intelligence Engine (Documento 15). */

export {
  scoreToLevel,
  energyDensityPerGram,
  energyDensityLevel,
  proteinPer100Kcal,
  evidenceFromConfidence,
} from "./foodMetrics";
export { classifyFood } from "./foodClassification";
export { buildFoodAlerts } from "./foodAlerts";
export {
  matchesQuery,
  matchesCriteria,
  filterFoods,
  goalFitScore,
  recommendFoods,
} from "./foodFilters";
export { listFoods, getFoodById } from "./foodRepository";
export {
  importRawFoods,
  mapRawFoodToInsertRow,
  type FoodInsertRow,
  type ImportResult,
} from "./tbcaImport";
