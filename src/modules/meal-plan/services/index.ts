/** Serviços do Plano Alimentar (Documento 00 — dieta como consequência). */

export {
  buildMealPlan,
  classifyRole,
  isTimingAppropriate,
  resolveFoodName,
  findFoodSwaps,
  buildSwapItem,
  buildItemWithGrams,
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
