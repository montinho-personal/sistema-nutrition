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
  getMealPlanEdits,
  setMealPlanEdits,
  updateMealPlanEdits,
  getMealPlanMealsPerDay,
  setMealPlanMealsPerDay,
} from "./mealPlanRepository";
export {
  parseDirective,
  applyDirective,
  overrideCalories,
  emptyDirective,
  hasDirective,
  describeDirective,
  mergeDirectives,
  resolveStoredDirective,
  applyDirectiveToMacros,
} from "./mealPlanDirective";
export {
  applyPlanEdits,
  emptyEdits,
  hasPlanEdits,
  baseItemKey,
  swapFood,
  setFoodGrams,
  resetOverride,
  removeFood,
  restoreFood,
  addFood,
  setMealDetails,
} from "./mealPlanEdits";
export {
  deriveStudentPlan,
  type StudentPlanSources,
  type DerivedStudentPlan,
} from "./studentPlan";
