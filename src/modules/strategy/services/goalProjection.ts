/**
 * Motor de Definição Estratégica (Documento 04 — realismo antes da promessa).
 *
 * Dado o peso atual, a meta (kg) e o prazo (semanas), projeta de forma
 * determinística e auditável: ritmo necessário, déficit/superávit exigido,
 * realismo, perda de massa magra estimada, aderência provável e riscos — sempre
 * com uma alternativa realista quando a meta aperta. Nenhuma IA (Documento 08).
 */

import {
  CAPACITY_RANGE,
  ENERGY_KCAL_PER_KG,
  LEAN_LOSS,
  MAX_DEFICIT_PCT_TDEE,
  WEEKLY_GAIN_KG,
  WEEKLY_LOSS_PCT_BW,
} from "@/modules/strategy/constants/parameters";
import type {
  AdherenceLevel,
  GoalProjection,
  GoalProjectionInput,
  RealismLevel,
} from "@/modules/strategy/types";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const round1 = (v: number) => Math.round(v * 10) / 10;
const pct = (v: number) => Math.round(v * 100);

/** Realismo do emagrecimento: comparado ao ritmo seguro (% do peso/semana). */
function lossRealism(
  ratePctBW: number,
  deltaPctTdee: number,
): { level: RealismLevel; score: number; reason: string } {
  const { safe, max, extreme } = WEEKLY_LOSS_PCT_BW;
  const score = clamp(Math.round(100 - (ratePctBW / max) * 60), 0, 100);

  if (ratePctBW <= safe && deltaPctTdee <= MAX_DEFICIT_PCT_TDEE) {
    return {
      level: "tranquilo",
      score,
      reason: `Ritmo de ${pct(ratePctBW)}% do peso por semana está dentro da faixa sustentável (até ${pct(safe)}%). Meta compatível com preservar massa magra e aderência.`,
    };
  }
  if (ratePctBW <= max && deltaPctTdee <= MAX_DEFICIT_PCT_TDEE) {
    return {
      level: "ambicioso",
      score,
      reason: `Ritmo de ${pct(ratePctBW)}% do peso por semana é agressivo (o limite sustentável fica perto de ${pct(max)}%). Dá para tentar, mas exige execução quase perfeita.`,
    };
  }
  return {
    level: "irrealista",
    score,
    reason:
      ratePctBW > extreme
        ? `Ritmo de ${pct(ratePctBW)}% do peso por semana está muito acima do limite fisiológico seguro (~${pct(max)}%). Não é sustentável sem perda importante de músculo.`
        : `Exige um déficit de ${pct(deltaPctTdee)}% do gasto — acima do tolerável (${pct(MAX_DEFICIT_PCT_TDEE)}%). A fome e a queda de energia inviabilizariam a aderência.`,
  };
}

/** Realismo do ganho: limitado por quanto músculo se constrói por semana. */
function gainRealism(rateKg: number): { level: RealismLevel; score: number; reason: string } {
  const { safe, max } = WEEKLY_GAIN_KG;
  const score = clamp(Math.round(100 - (rateKg / max) * 60), 0, 100);
  if (rateKg <= safe) {
    return {
      level: "tranquilo",
      score,
      reason: `Ganhar ${round1(rateKg)} kg/semana respeita o teto fisiológico de construção muscular (~${safe} kg/semana). A maior parte do ganho tende a ser massa magra.`,
    };
  }
  if (rateKg <= max) {
    return {
      level: "ambicioso",
      score,
      reason: `Ganhar ${round1(rateKg)} kg/semana está acima do ideal para ganho limpo (${safe} kg/semana). Parte do ganho será gordura.`,
    };
  }
  return {
    level: "irrealista",
    score,
    reason: `Ganhar ${round1(rateKg)} kg/semana ultrapassa em muito a construção muscular possível (~${safe} kg/semana). O excedente vira gordura, não músculo.`,
  };
}

/** Fração da perda que vem de massa magra (só no emagrecimento). */
function estimateLeanLoss(input: GoalProjectionInput, ratePctBW: number) {
  const extra = Math.max(0, ratePctBW - WEEKLY_LOSS_PCT_BW.safe);
  let fraction = LEAN_LOSS.base + extra * LEAN_LOSS.slopePerPctBW;
  if (input.trainsRegularly) fraction -= LEAN_LOSS.trainingRelief;
  if (input.proteinAdequate) fraction -= LEAN_LOSS.proteinRelief;
  fraction = clamp(fraction, LEAN_LOSS.min, LEAN_LOSS.max);

  const estimatedLeanLossKg = round1(input.targetChangeKg * fraction);
  const reliefs: string[] = [];
  if (input.trainsRegularly) reliefs.push("treino de força regular");
  if (input.proteinAdequate) reliefs.push("proteína adequada");
  const note =
    reliefs.length > 0
      ? `Com ${reliefs.join(" e ")}, a perda de massa magra fica contida. Manter ambos é o que protege o músculo.`
      : "Sem treino de força e proteína alta, boa parte da perda seria de músculo — os dois são inegociáveis aqui.";

  return { leanFractionPct: pct(fraction), estimatedLeanLossKg, note };
}

/** Aderência estimada: capacidade do aluno menos o "excesso" de ritmo pedido. */
function estimateAdherence(
  input: GoalProjectionInput,
  deltaPctTdee: number,
): { level: AdherenceLevel; score: number; reason: string } {
  const { floor, ceil } = CAPACITY_RANGE;
  const capNorm = clamp(((input.capacity - floor) / (ceil - floor)) * 100, 0, 100);

  // Pedir mais ajuste do que a velocidade prescrita derruba a aderência.
  const overshoot =
    input.prescribedDeltaPct > 0
      ? Math.max(0, deltaPctTdee / input.prescribedDeltaPct - 1)
      : 0;
  const penalty = clamp(overshoot * 50, 0, 45);
  const score = clamp(Math.round(capNorm - penalty), 0, 100);

  const level: AdherenceLevel = score >= 66 ? "alta" : score >= 40 ? "media" : "baixa";
  const reason =
    penalty >= 10
      ? `A capacidade atual do aluno sustentaria ~${Math.round(capNorm)}/100, mas o ritmo pedido vai além da velocidade prescrita e derruba a aderência provável para ${score}/100.`
      : `Capacidade de execução do diagnóstico sustenta uma aderência de ~${score}/100 neste ritmo.`;
  return { level, score, reason };
}

/** Monta a lista de riscos — cada risco é acionável (Documento 02). */
function buildRisks(
  input: GoalProjectionInput,
  realismLevel: RealismLevel,
  deltaPctTdee: number,
  muscle: GoalProjection["muscle"],
  adherenceLevel: AdherenceLevel,
): string[] {
  const risks: string[] = [];
  if (realismLevel === "irrealista") {
    risks.push("A meta no prazo pedido não é fisiologicamente segura — estender o prazo é o ajuste mais importante.");
  } else if (realismLevel === "ambicioso") {
    risks.push("Ritmo agressivo: monitorar fome, energia e força de perto e desacelerar se a aderência cair.");
  }
  if (input.direction === "deficit" && deltaPctTdee > MAX_DEFICIT_PCT_TDEE) {
    risks.push(`O déficit necessário (${pct(deltaPctTdee)}% do gasto) passa do tolerável — fome intensa e perda de energia.`);
  }
  if (muscle && muscle.leanFractionPct >= 25) {
    risks.push("Risco relevante de perder músculo — proteína alta e treino de força não podem faltar.");
  }
  if (input.direction === "deficit" && !input.trainsRegularly) {
    risks.push("Sem treino de força regular, mais da perda tende a vir de massa magra.");
  }
  if (adherenceLevel === "baixa") {
    risks.push("A capacidade atual torna esse ritmo difícil de sustentar — um alvo mais conservador protege o resultado.");
  }
  if (input.direction === "superavit" && realismLevel !== "tranquilo") {
    risks.push("Superávit acima do ideal adiciona gordura desnecessária — o excesso não vira músculo mais rápido.");
  }
  return risks;
}

/** Sugestão de prazo realista quando a meta pedida não é tranquila. */
function buildSuggestion(
  input: GoalProjectionInput,
  realismLevel: RealismLevel,
): GoalProjection["suggestion"] {
  if (realismLevel === "tranquilo") return null;
  const safeRateKg =
    input.direction === "deficit"
      ? input.currentWeightKg * WEEKLY_LOSS_PCT_BW.safe
      : WEEKLY_GAIN_KG.safe;
  if (safeRateKg <= 0) return null;
  const weeks = Math.ceil(input.targetChangeKg / safeRateKg);
  return {
    weeklyRateKg: round1(safeRateKg),
    weeks,
    reason: `No ritmo sustentável de ${round1(safeRateKg)} kg/semana, a mesma meta levaria cerca de ${weeks} semanas — com muito mais chance de manter o resultado.`,
  };
}

/**
 * Projeta a meta. Espera `targetChangeKg > 0` e `weeks > 0` (o chamador só
 * projeta quando ambos existem) e uma direção com movimento de peso
 * (déficit ou superávit — na manutenção não há projeção de peso).
 */
export function projectGoal(input: GoalProjectionInput): GoalProjection {
  const weeklyRateKg = input.targetChangeKg / input.weeks;
  const weeklyRatePctBW = weeklyRateKg / input.currentWeightKg;
  const dailyEnergyDeltaKcal = Math.round((weeklyRateKg * ENERGY_KCAL_PER_KG) / 7);
  const requiredDeltaPctTdee = input.tdee > 0 ? dailyEnergyDeltaKcal / input.tdee : 0;

  const realism =
    input.direction === "superavit"
      ? gainRealism(weeklyRateKg)
      : lossRealism(weeklyRatePctBW, requiredDeltaPctTdee);

  const muscle =
    input.direction === "deficit" ? estimateLeanLoss(input, weeklyRatePctBW) : null;

  const adherence = estimateAdherence(input, requiredDeltaPctTdee);
  const risks = buildRisks(input, realism.level, requiredDeltaPctTdee, muscle, adherence.level);
  const suggestion = buildSuggestion(input, realism.level);

  return {
    weeklyRateKg: round1(weeklyRateKg),
    weeklyRatePctBW,
    dailyEnergyDeltaKcal,
    requiredDeltaPctTdee,
    realism,
    muscle,
    adherence,
    risks,
    suggestion,
  };
}
