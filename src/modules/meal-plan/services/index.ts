/** Serviços do Plano Alimentar (Documento 00 — dieta como consequência). */

export {
  buildMealPlan,
  classifyRole,
  isTimingAppropriate,
  findFoodSwaps,
  buildSwapItem,
  sumItems,
  type MealPlanContext,
} from "./mealPlanEngine";
export { buildDietaryFilter, RESTRICTION_LABELS } from "./dietaryFilters";
export {
  getMealPlanVariant,
  setMealPlanVariant,
  getMealPlanInstruction,
  getMealPlanDirective,
  setMealPlanInstruction,
} from "./mealPlanRepository";
export {
  parseDirective,
  applyDirective,
  overrideCalories,
  emptyDirective,
  hasDirective,
  describeDirective,
  mergeDirectives,
} from "./mealPlanDirective";
