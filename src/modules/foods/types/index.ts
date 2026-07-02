/**
 * Tipos de domínio do Food Intelligence Engine (Documento 15).
 */

import type { EvidenceLevel } from "@/shared/types";

/** Escala qualitativa de 5 níveis usada em vários perfis. */
export type QualitativeLevel = "very_low" | "low" | "moderate" | "high" | "very_high";

/** Classificação estratégica de um alimento (Documento 15). */
export type StrategicClassification =
  "excellent" | "good" | "neutral" | "poor" | "context_dependent";

/** Faixa de custo (5 níveis — Documento 15, Perfil Financeiro). */
export type CostRange = "very_low" | "low" | "medium" | "high" | "very_high";

/** Nível de processamento (classificação NOVA). */
export type ProcessingLevel = "in_natura" | "minimally_processed" | "processed" | "ultra_processed";

/** Confiança dos dados nutricionais (Perfil Científico). */
export type DataConfidence = "high" | "medium" | "low" | "estimated";

/** Momentos de utilização do alimento (Documento 15). */
export type MealTiming =
  | "breakfast"
  | "pre_workout"
  | "post_workout"
  | "lunch"
  | "snack"
  | "dinner"
  | "supper"
  | "emergency"
  | "travel";

/** Objetivos para os quais o alimento é indicado. */
export type FoodGoal =
  "weight_loss" | "hypertrophy" | "recomposition" | "performance" | "maintenance";

/** Risco de exagero / palatabilidade. */
export type OveratingRisk = "low" | "moderate" | "high";

/** Composição nutricional por 100 g. */
export interface FoodNutrition {
  energyKcal: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
  sugarG: number | null;
  saturatedFatG: number | null;
  sodiumMg: number | null;
  potassiumMg: number | null;
}

/** Atributos estratégicos, práticos, comportamentais e logísticos. */
export interface FoodAttributes {
  satietyScore: number | null;
  practicalityScore: number | null;
  digestibilityScore: number | null;
  palatabilityScore: number | null;
  acceptanceScore: number | null;
  overeatingRisk: OveratingRisk | null;
  costRange: CostRange | null;
  availability: "low" | "medium" | "high" | null;
  prepTimeMinutes: number | null;
  freezesWell: boolean | null;
  portability: boolean | null;
  needsCooking: boolean | null;
  canEatCold: boolean | null;
  canPrepAhead: boolean | null;
  goodForLunchbox: boolean | null;
  goodForTravel: boolean | null;
  goodForHungerControl: boolean | null;
  goodForFewMeals: boolean | null;
  bestTimes: MealTiming[];
  suitableGoals: FoodGoal[];
  strategicApplications: string | null;
  /** Sobrescreve a classificação computada, quando definido. */
  strategicOverride: StrategicClassification | null;
}

/** Uma tag associada ao alimento, com sua classe. */
export interface FoodTag {
  name: string;
  type: "strategic" | "nutritional" | "dietary" | "logistic" | "timing";
}

/** Medida caseira. */
export interface FoodPortion {
  name: string;
  grams: number;
}

/** Alimento completo do banco inteligente (view foods_enriched + relações). */
export interface Food {
  id: string;
  name: string;
  foodGroup: string | null;
  subgroup: string | null;
  description: string | null;
  synonyms: string[];
  categoryName: string | null;
  sourceName: string | null;
  sourceCode: string | null;
  dataConfidence: DataConfidence;
  processingLevel: ProcessingLevel | null;
  nutrition: FoodNutrition;
  attributes: FoodAttributes;
  tags: FoodTag[];
  portions: FoodPortion[];
}

/** Alerta contextual sobre um alimento — sempre com orientação (Documento 02). */
export interface FoodAlert {
  kind: "low_protein" | "high_sodium" | "ultra_processed" | "low_satiety" | "overeating_risk";
  message: string;
  /** Orientação — nunca apenas avisar (Documento 15: nunca demonizar). */
  guidance: string;
  severity: "info" | "attention";
}

/** Resultado da classificação estratégica. */
export interface StrategicAssessment {
  classification: StrategicClassification;
  /** Justificativas legíveis da classificação (transparência — Documento 00). */
  reasons: string[];
  /** Origem: override manual ou computada pelo motor. */
  computed: boolean;
}

/** Critérios de busca e filtro (Documento 15 — Motores de Busca e Filtros). */
export interface FoodFilterCriteria {
  query?: string;
  categoryName?: string;
  goal?: FoodGoal;
  timing?: MealTiming;
  tags?: string[];
  maxPrepMinutes?: number;
  maxCost?: CostRange;
  minProteinG?: number;
  minFiberG?: number;
  maxEnergyKcal?: number;
  minSatietyScore?: number;
  onlyPortable?: boolean;
  onlyLunchbox?: boolean;
  onlyFreezable?: boolean;
}

/** Evidência associada ao dado nutricional (mapeada da confiança). */
export type FoodEvidence = EvidenceLevel;
