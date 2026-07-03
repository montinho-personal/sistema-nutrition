/**
 * Parâmetros estratégicos configuráveis (Documento 08 — nenhum número mágico).
 *
 * Toda a matemática da estratégia lê daqui. Nenhum valor fixo vive dentro da
 * lógica dos motores — este é o único ponto de verdade e, no futuro, a tela de
 * Configurações vai expô-los para ajuste sem tocar no código.
 */

import type { StudentGoal } from "@/modules/students/types";
import type {
  EnergyDirection,
  FlexibilityLevel,
  FoodPhilosophy,
  MacroParams,
  StrategyVelocity,
} from "@/modules/strategy/types";

/** Energia por grama de macronutriente (Atwater). */
export const KCAL_PER_GRAM = { protein: 4, carb: 4, fat: 9 } as const;

/** Mifflin-St Jeor — coeficientes do gasto basal (BMR). */
export const MIFFLIN = {
  weight: 10,
  height: 6.25,
  age: 5,
  sexOffsetMale: 5,
  sexOffsetFemale: -161,
} as const;

/** Katch-McArdle — usado quando há % de gordura (mais preciso). */
export const KATCH = { base: 370, lbmFactor: 21.6 } as const;

/** Fallback quando faltam idade/altura/sexo: kcal por kg de peso. */
export const FALLBACK_KCAL_PER_KG = 22;

/** Fatores de atividade (multiplicadores do BMR → TDEE). */
export const ACTIVITY_FACTORS: Record<string, number> = {
  sedentario: 1.2,
  moderado: 1.375,
  ativo: 1.55,
};
export const DEFAULT_ACTIVITY_FACTOR = ACTIVITY_FACTORS.sedentario;

/** Acréscimo ao fator de atividade conforme a frequência de treino. */
export const TRAINING_BONUS: Record<string, number> = {
  regular: 0.15,
  irregular: 0.075,
  nao: 0,
};

/** Teto do fator de atividade total, para não superestimar o TDEE. */
export const MAX_ACTIVITY_FACTOR = 1.9;

/** Objetivo → direção energética (déficit, manutenção ou superávit). */
export const GOAL_DIRECTION: Record<StudentGoal, EnergyDirection> = {
  weight_loss: "deficit",
  event_preparation: "deficit",
  hypertrophy: "superavit",
  recomposition: "manutencao",
  maintenance: "manutencao",
  health: "manutencao",
  performance: "manutencao",
};

/** Ajuste calórico (fração do TDEE) por velocidade, no déficit. */
export const VELOCITY_DEFICIT_PCT: Record<StrategyVelocity, number> = {
  muito_conservadora: 0.08,
  conservadora: 0.12,
  moderada: 0.18,
  intensiva: 0.24,
  agressiva: 0.3,
};

/** Ajuste calórico (fração do TDEE) por velocidade, no superávit. */
export const VELOCITY_SURPLUS_PCT: Record<StrategyVelocity, number> = {
  muito_conservadora: 0.05,
  conservadora: 0.08,
  moderada: 0.12,
  intensiva: 0.16,
  agressiva: 0.2,
};

/** Proteína (g por kg de peso) por objetivo. */
export const PROTEIN_G_PER_KG: Record<StudentGoal, number> = {
  weight_loss: 2.0,
  event_preparation: 2.2,
  hypertrophy: 1.8,
  recomposition: 2.0,
  maintenance: 1.6,
  health: 1.6,
  performance: 1.8,
};

/** Gordura mínima (g por kg de peso) — piso hormonal/saciedade. */
export const FAT_G_PER_KG = 0.8;

/**
 * Conjunto padrão dos parâmetros de macro configuráveis (Documento 08).
 * A tela de Configurações sobrescreve isto por usuário; o motor de macros lê
 * daqui quando nada é sobrescrito.
 */
export const DEFAULT_MACRO_PARAMS: MacroParams = {
  proteinGPerKg: PROTEIN_G_PER_KG,
  fatGPerKg: FAT_G_PER_KG,
  velocityDeficitPct: VELOCITY_DEFICIT_PCT,
  velocitySurplusPct: VELOCITY_SURPLUS_PCT,
};

/** Arredondamentos (múltiplos) para números "redondos" e realistas. */
export const CALORIE_ROUNDING = 10;

/** Limites de sanidade do ajuste manual de macros (Documento 08 — sem número mágico). */
export const MACRO_OVERRIDE_LIMITS = {
  minCalories: 800,
  maxCalories: 6000,
} as const;

/**
 * Piso de segurança para as calorias derivadas da meta (Definição Estratégica).
 * Metas muito agressivas exigiriam calorias baixas/negativas; o cardápio nunca
 * mira abaixo deste piso, ainda que a meta peça mais.
 */
export const GOAL_CALORIES_FLOOR = 1200;

// ── Definição Estratégica: projeção de meta (Documento 04 — realismo) ─────────

/**
 * Energia por kg de massa corporal (kcal). ~7700 kcal/kg é a estimativa
 * clássica para tecido corporal — base determinística da projeção de meta.
 */
export const ENERGY_KCAL_PER_KG = 7700;

/**
 * Ritmo semanal de emagrecimento como fração do peso corporal.
 * Referência de segurança consolidada: até ~1%/semana é sustentável; acima
 * disso, sobe o risco de perda de massa magra e de abandono.
 */
export const WEEKLY_LOSS_PCT_BW = { safe: 0.0075, max: 0.01, extreme: 0.0125 } as const;

/**
 * Ritmo semanal de ganho (kg absolutos). O ganho de massa magra é limitado por
 * fisiologia — apressar só adiciona gordura.
 */
export const WEEKLY_GAIN_KG = { safe: 0.25, max: 0.5, extreme: 0.75 } as const;

/** Déficit máximo tolerável como fração do TDEE, antes de fome/queda de energia. */
export const MAX_DEFICIT_PCT_TDEE = 0.35;

/**
 * Modelo determinístico da fração da perda que vem de massa magra.
 * fração = base + (ritmo acima do seguro) × slope, aliviada por treino de força
 * e proteína adequada, limitada a [min, max].
 */
export const LEAN_LOSS = {
  base: 0.18,
  slopePerPctBW: 40,
  trainingRelief: 0.08,
  proteinRelief: 0.05,
  min: 0.05,
  max: 0.45,
} as const;

/** Capacidade de execução (aderência + consistência − risco) → faixa de normalização. */
export const CAPACITY_RANGE = { floor: 40, ceil: 140 } as const;

/** Faixa de refeições/dia permitida (Documento 04 — Etapa 5). */
export const MEALS_MIN = 3;
export const MEALS_MAX = 6;
export const MEALS_BASE = 4;

/**
 * Limiares de score que orientam a velocidade (Documento 03D/04).
 * "Capacidade de execução" = aderência + consistência − risco de abandono.
 */
export const VELOCITY_THRESHOLDS = {
  /** Abaixo disto, protege-se a aderência com velocidade conservadora. */
  lowCapacity: 60,
  /** Acima disto, há margem para intensificar. */
  highCapacity: 110,
  /** Risco de abandono acima disto puxa a velocidade para baixo. */
  highAbandonmentRisk: 60,
  /** Flexibilidade abaixo disto (tudo-ou-nada) pede cautela. */
  lowFlexibility: 40,
} as const;

/** Limiares gerais reutilizados pelas regras da estratégia. */
export const SCORE_THRESHOLDS = {
  low: 40,
  mid: 55,
  high: 65,
  veryHigh: 75,
} as const;

/** Rótulos pt-BR das dimensões da estratégia (UI em português). */
export const VELOCITY_LABELS: Record<StrategyVelocity, string> = {
  muito_conservadora: "Muito conservadora",
  conservadora: "Conservadora",
  moderada: "Moderada",
  intensiva: "Intensiva",
  agressiva: "Agressiva",
};

export const DIRECTION_LABELS: Record<EnergyDirection, string> = {
  deficit: "Déficit calórico",
  manutencao: "Manutenção calórica",
  superavit: "Superávit calórico",
};

export const PHILOSOPHY_LABELS: Record<FoodPhilosophy, string> = {
  plano_tradicional: "Plano alimentar tradicional",
  metodo_porcoes: "Método das porções",
  contagem_macros: "Contagem de macros",
  contagem_calorias: "Contagem de calorias",
  hibrida: "Estratégia híbrida",
};

export const FLEXIBILITY_LABELS: Record<FlexibilityLevel, string> = {
  planejada: "Flexibilidade planejada",
  baixa: "Baixa",
  moderada: "Moderada",
  alta: "Alta",
};
