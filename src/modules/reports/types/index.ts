/**
 * Tipos do Relatório do Aluno (Documento 02 — Documento Final premium).
 *
 * O relatório é a consolidação determinística de todos os módulos num único
 * documento apresentável (Documento 08 — regra, não IA).
 */

import type { DiagnosisScore, ExecutiveSummary, Hypothesis } from "@/modules/diagnosis/types";
import type { MacroTargets, NutritionStrategy } from "@/modules/strategy/types";
import type { MealPlan } from "@/modules/meal-plan/types";
import type { Evolution, EvolutionInsight } from "@/modules/follow-ups/types";
import type { Roadmap } from "@/modules/roadmap/types";

export interface ReportMeta {
  studentName: string;
  goalLabel: string | null;
  ageYears: number | null;
  /** Data de geração (yyyy-mm-dd). */
  generatedAt: string;
  /** Confiança do diagnóstico (0–100). */
  confidence: number;
  startWeightKg: number;
  bodyFatPct: number | null;
  /** Meta de mudança de peso (kg, magnitude) da Definição Estratégica — capa. */
  targetChangeKg: number | null;
  /** Prazo da meta (semanas). */
  targetWeeks: number | null;
}

/** Documento consolidado do aluno (resumo, estratégia, macros, plano, evolução, jornada). */
export interface ReportModel {
  meta: ReportMeta;
  summary: ExecutiveSummary;
  scores: DiagnosisScore[];
  hypotheses: Hypothesis[];
  strategy: NutritionStrategy;
  macros: MacroTargets;
  mealPlan: MealPlan;
  evolution: Evolution | null;
  evolutionInsights: EvolutionInsight[];
  roadmap: Roadmap;
}
