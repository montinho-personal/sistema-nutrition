/**
 * Parâmetros configuráveis do Food Intelligence Engine.
 *
 * Todos os limiares de classificação, rótulos e regras vivem aqui —
 * nenhum número mágico espalhado pelo código (Documentos 08 e 11).
 * Ajustar estes valores recalibra o motor sem tocar na lógica.
 */

import type {
  CostRange,
  FoodGoal,
  MealTiming,
  ProcessingLevel,
  QualitativeLevel,
} from "@/modules/foods/types";

/** Limiares dos 5 níveis qualitativos a partir de um score 0–100. */
export const QUALITATIVE_THRESHOLDS: { level: QualitativeLevel; min: number }[] = [
  { level: "very_high", min: 80 },
  { level: "high", min: 60 },
  { level: "moderate", min: 40 },
  { level: "low", min: 20 },
  { level: "very_low", min: 0 },
];

/** Limiares de densidade energética (kcal por grama). */
export const ENERGY_DENSITY_THRESHOLDS: { level: QualitativeLevel; maxKcalPerGram: number }[] = [
  { level: "very_low", maxKcalPerGram: 0.6 },
  { level: "low", maxKcalPerGram: 1.5 },
  { level: "moderate", maxKcalPerGram: 2.5 },
  { level: "high", maxKcalPerGram: 4 },
  { level: "very_high", maxKcalPerGram: Infinity },
];

/** Parâmetros da classificação estratégica (Documento 15). */
export const CLASSIFICATION_CONFIG = {
  /** g de proteína por 100 kcal para ser considerada "boa densidade proteica". */
  goodProteinPer100Kcal: 8,
  /** g de fibra por 100 g para ser considerada "rica em fibra". */
  highFiberG: 5,
  /** satiety_score mínimo para "excelente". */
  excellentSatiety: 70,
  /** satiety_score mínimo para "bom". */
  goodSatiety: 55,
  /** kcal/g a partir do qual o alimento é "context_dependent" (denso). */
  contextDependentDensity: 4,
  /** satiety_score abaixo do qual entra o alerta de baixa saciedade. */
  lowSatietyAlert: 35,
  /** g de proteína por 100 kcal abaixo do qual entra o alerta de baixa proteína. */
  lowProteinPer100Kcal: 3,
  /** sódio (mg/100 g) a partir do qual entra o alerta de sódio elevado. */
  highSodiumMg: 400,
} as const;

/** Mapeia confiança dos dados para nível de evidência. */
export const CONFIDENCE_TO_EVIDENCE = {
  high: "strong",
  medium: "moderate",
  low: "limited",
  estimated: "expert_opinion",
} as const;

/** Ordem relativa das faixas de custo (para comparação em filtros). */
export const COST_ORDER: Record<CostRange, number> = {
  very_low: 0,
  low: 1,
  medium: 2,
  high: 3,
  very_high: 4,
};

/** Rótulos em pt-BR dos níveis qualitativos. */
export const QUALITATIVE_LABELS: Record<QualitativeLevel, string> = {
  very_low: "Muito baixa",
  low: "Baixa",
  moderate: "Moderada",
  high: "Alta",
  very_high: "Muito alta",
};

/** Rótulos em pt-BR das classificações estratégicas. */
export const CLASSIFICATION_LABELS = {
  excellent: "Excelente",
  good: "Bom",
  neutral: "Neutro",
  poor: "Pouco indicado",
  context_dependent: "Depende do contexto",
} as const;

/** Rótulos em pt-BR das faixas de custo. */
export const COST_LABELS: Record<CostRange, string> = {
  very_low: "Muito barato",
  low: "Barato",
  medium: "Intermediário",
  high: "Caro",
  very_high: "Muito caro",
};

/** Rótulos em pt-BR do nível de processamento. */
export const PROCESSING_LABELS: Record<ProcessingLevel, string> = {
  in_natura: "In natura",
  minimally_processed: "Minimamente processado",
  processed: "Processado",
  ultra_processed: "Ultraprocessado",
};

/** Rótulos em pt-BR dos objetivos. */
export const GOAL_LABELS: Record<FoodGoal, string> = {
  weight_loss: "Emagrecimento",
  hypertrophy: "Hipertrofia",
  recomposition: "Recomposição",
  performance: "Performance",
  maintenance: "Manutenção",
};

/** Rótulos em pt-BR dos momentos de utilização. */
export const TIMING_LABELS: Record<MealTiming, string> = {
  breakfast: "Café da manhã",
  pre_workout: "Pré-treino",
  post_workout: "Pós-treino",
  lunch: "Almoço",
  snack: "Lanche",
  dinner: "Jantar",
  supper: "Ceia",
  emergency: "Emergência",
  travel: "Viagem",
};
