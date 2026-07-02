/**
 * Tipos do Módulo de Estratégia (Documento 04 — Strategic Prescription Engine).
 *
 * A estratégia é derivada de forma determinística do Diagnóstico + objetivo;
 * os macros só existem depois de a estratégia estar definida.
 */

import type { StudentGoal, StudentSex } from "@/modules/students/types";

export type StrategyVelocity =
  | "muito_conservadora"
  | "conservadora"
  | "moderada"
  | "intensiva"
  | "agressiva";

export type EnergyDirection = "deficit" | "manutencao" | "superavit";

export type FoodPhilosophy =
  | "plano_tradicional"
  | "metodo_porcoes"
  | "contagem_macros"
  | "contagem_calorias"
  | "hibrida";

export type FlexibilityLevel = "planejada" | "baixa" | "moderada" | "alta";

/**
 * Uma decisão da estratégia — molda o DecisionCard (Documentos 02/04):
 * nenhuma escolha sem justificativa técnica.
 */
export interface StrategyDecision {
  id: string;
  step: number;
  title: string;
  decision: string;
  reason: string;
  benefits: string[];
  risks: string[];
  alternatives: string[];
}

/** A Estratégia Nutricional completa (as 12 etapas do SPE). */
export interface NutritionStrategy {
  goal: StudentGoal;
  velocity: StrategyVelocity;
  direction: EnergyDirection;
  philosophy: FoodPhilosophy;
  flexibility: FlexibilityLevel;
  mealsPerDay: number;
  decisions: StrategyDecision[];
}

/** Dados antropométricos que a anamnese não captura (necessários p/ macros). */
export interface StrategyInput {
  currentWeightKg: number;
  bodyFatPct: number | null;
}

/**
 * Parâmetros de macro configuráveis (Documento 08). Padrões vivem nas
 * constantes; a tela de Configurações permite sobrescrevê-los por usuário.
 */
export interface MacroParams {
  /** Proteína (g por kg de peso) por objetivo. */
  proteinGPerKg: Record<StudentGoal, number>;
  /** Gordura mínima (g por kg de peso). */
  fatGPerKg: number;
  /** Ajuste calórico (fração do TDEE) por velocidade, no déficit. */
  velocityDeficitPct: Record<StrategyVelocity, number>;
  /** Ajuste calórico (fração do TDEE) por velocidade, no superávit. */
  velocitySurplusPct: Record<StrategyVelocity, number>;
}

export type BmrMethod = "katch_mcardle" | "mifflin" | "fallback";

/** Alvos de macronutrientes calculados (Documento 04 — depois da estratégia). */
export interface MacroTargets {
  bmr: number;
  bmrMethod: BmrMethod;
  activityFactor: number;
  tdee: number;
  calories: number;
  proteinG: number;
  fatG: number;
  carbG: number;
  proteinKcal: number;
  fatKcal: number;
  carbKcal: number;
  justifications: string[];
}

/** Contexto antropométrico + de rotina consumido pelo motor de macros. */
export interface MacroContext {
  weightKg: number;
  bodyFatPct: number | null;
  heightCm: number | null;
  ageYears: number | null;
  sex: StudentSex | null;
  /** Nível de atividade vindo do diagnóstico (sedentario/moderado/ativo). */
  activity: string | null;
  /** Frequência de treino vinda do diagnóstico (regular/irregular/nao). */
  trains: string | null;
}

/** Registro persistido (local-first): apenas o input; o resto é derivado. */
export interface StrategyRecord {
  studentId: string;
  input: StrategyInput;
  createdAt: string;
  updatedAt: string;
}
