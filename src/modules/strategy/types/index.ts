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
  /** Ids de entradas da Base de Conhecimento que embasam a decisão. */
  knowledgeIds?: string[];
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

/**
 * Ajuste manual do treinador: sobrescreve as calorias-alvo e a divisão de
 * macros calculadas. Dá flexibilidade quando o treinador quer prescrever números
 * próprios — mas o cálculo automático segue disponível como referência.
 */
export interface MacroOverride {
  /** Calorias-alvo definidas manualmente. */
  calories: number;
  /** Percentual de cada macro sobre as calorias (somam 100). */
  proteinPct: number;
  carbPct: number;
  fatPct: number;
}

/** Abordagem alimentar (Workflow V1 — Etapa 4). */
export type DietApproachId =
  | "tradicional"
  | "flexivel"
  | "low_carb"
  | "alta_proteina"
  | "jejum";

/**
 * Uma abordagem alimentar: molda a distribuição de macros e as refeições, sem
 * mudar as calorias-alvo. O treinador escolhe; o sistema sugere uma por padrão.
 */
export interface DietApproach {
  id: DietApproachId;
  label: string;
  /** Rótulo curto do foco (ex.: "Menos carboidrato"). */
  emphasis: string;
  description: string;
  /** Alvo de proteína (g/kg) quando a abordagem a eleva. */
  proteinGPerKg?: number;
  /** Teto de carboidrato (g/kg) quando a abordagem o restringe. */
  carbMaxGPerKg?: number;
  /** Refeições/dia sugeridas (sobrepõe a estratégia). */
  meals?: number;
}

/** Dados antropométricos que a anamnese não captura (necessários p/ macros). */
export interface StrategyInput {
  currentWeightKg: number;
  bodyFatPct: number | null;
  /** Meta de mudança de peso (kg, magnitude) — Definição Estratégica. Opcional. */
  targetChangeKg?: number | null;
  /** Prazo desejado para a meta (semanas). Opcional. */
  targetWeeks?: number | null;
  /** Ajuste manual de calorias/macros pelo treinador. Ausente = cálculo automático. */
  macroOverride?: MacroOverride | null;
  /** Abordagem alimentar escolhida. Ausente = a sugerida pelo sistema. */
  dietApproach?: DietApproachId | null;
}

/** Nível qualitativo do realismo de uma meta. */
export type RealismLevel = "tranquilo" | "ambicioso" | "irrealista";
/** Nível qualitativo da aderência estimada. */
export type AdherenceLevel = "alta" | "media" | "baixa";

/** Entrada do motor de projeção de meta (Definição Estratégica — Documento 04). */
export interface GoalProjectionInput {
  currentWeightKg: number;
  /** Magnitude da mudança desejada (kg, sempre > 0). */
  targetChangeKg: number;
  /** Prazo desejado (semanas, sempre > 0). */
  weeks: number;
  direction: EnergyDirection;
  velocity: StrategyVelocity;
  tdee: number;
  /** Fração de ajuste calórico prescrita pela velocidade (déficit/superávit). */
  prescribedDeltaPct: number;
  trainsRegularly: boolean;
  proteinAdequate: boolean;
  /** Capacidade de execução do diagnóstico (aderência + consistência − risco). */
  capacity: number;
}

/** Projeção determinística de uma meta: honestidade antes da promessa. */
export interface GoalProjection {
  weeklyRateKg: number;
  weeklyRatePctBW: number;
  dailyEnergyDeltaKcal: number;
  requiredDeltaPctTdee: number;
  realism: { level: RealismLevel; score: number; reason: string };
  /** Só no emagrecimento: estimativa de perda de massa magra. */
  muscle: { leanFractionPct: number; estimatedLeanLossKg: number; note: string } | null;
  adherence: { level: AdherenceLevel; score: number; reason: string };
  risks: string[];
  /** Alternativa mais realista, quando a meta pedida não é tranquila. */
  suggestion: { weeklyRateKg: number; weeks: number; reason: string } | null;
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
  /** true quando os números vêm de um ajuste manual do treinador. */
  manual: boolean;
}

/**
 * Decomposição do gasto energético diário (Documento 04): quanto vem do
 * metabolismo basal, do treino e das demais atividades — e o total (TDEE).
 */
export interface EnergyBreakdown {
  /** Taxa de metabolismo basal (kcal/dia em repouso). */
  bmr: number;
  bmrMethod: BmrMethod;
  /** Gasto estimado com o treino. */
  trainingKcal: number;
  /** Gasto com as demais atividades do dia a dia (fora o treino). */
  dailyActivityKcal: number;
  /** Gasto energético total (TDEE) = soma das partes. */
  tdee: number;
  activityFactor: number;
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
  /** Dias de treino por semana (anamnese) — refina o gasto quando informado. */
  trainingDaysPerWeek?: number | null;
  /** Duração média de cada treino em minutos (anamnese). */
  trainingMinutes?: number | null;
}

/** Registro persistido (local-first): apenas o input; o resto é derivado. */
export interface StrategyRecord {
  studentId: string;
  input: StrategyInput;
  createdAt: string;
  updatedAt: string;
}
