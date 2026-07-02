/**
 * Schemas de validação do domínio Foods (Documento 11 — validação sempre com Zod).
 */

import { z } from "zod";

export const mealTimingSchema = z.enum([
  "breakfast",
  "pre_workout",
  "post_workout",
  "lunch",
  "snack",
  "dinner",
  "supper",
  "emergency",
  "travel",
]);

export const foodGoalSchema = z.enum([
  "weight_loss",
  "hypertrophy",
  "recomposition",
  "performance",
  "maintenance",
]);

export const costRangeSchema = z.enum(["very_low", "low", "medium", "high", "very_high"]);

export const processingLevelSchema = z.enum([
  "in_natura",
  "minimally_processed",
  "processed",
  "ultra_processed",
]);

export const dataConfidenceSchema = z.enum(["high", "medium", "low", "estimated"]);

/** Critérios de filtro validados (entrada dos motores de busca/filtro). */
export const foodFilterCriteriaSchema = z.object({
  query: z.string().trim().max(120).optional(),
  categoryName: z.string().optional(),
  goal: foodGoalSchema.optional(),
  timing: mealTimingSchema.optional(),
  tags: z.array(z.string()).optional(),
  maxPrepMinutes: z.number().int().min(0).optional(),
  maxCost: costRangeSchema.optional(),
  minProteinG: z.number().min(0).optional(),
  minFiberG: z.number().min(0).optional(),
  maxEnergyKcal: z.number().min(0).optional(),
  minSatietyScore: z.number().min(0).max(100).optional(),
  onlyPortable: z.boolean().optional(),
  onlyLunchbox: z.boolean().optional(),
  onlyFreezable: z.boolean().optional(),
});

export type FoodFilterCriteriaInput = z.infer<typeof foodFilterCriteriaSchema>;

/**
 * Registro nutricional cru de uma fonte externa (ex.: linha da TBCA),
 * antes de ser mapeado para o schema do banco.
 */
export const rawFoodImportSchema = z.object({
  sourceName: z.string().min(1),
  sourceCode: z.string().min(1),
  name: z.string().min(1),
  foodGroup: z.string().optional(),
  energyKcal: z.number().min(0).nullable(),
  proteinG: z.number().min(0).nullable(),
  carbsG: z.number().min(0).nullable(),
  fatG: z.number().min(0).nullable(),
  fiberG: z.number().min(0).nullable().optional(),
  sodiumMg: z.number().min(0).nullable().optional(),
  synonyms: z.array(z.string()).optional(),
  dataConfidence: dataConfidenceSchema.default("high"),
});

export type RawFoodImport = z.infer<typeof rawFoodImportSchema>;
