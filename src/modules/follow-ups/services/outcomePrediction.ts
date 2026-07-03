/**
 * Outcome Prediction Engine (Documento 03F — previsão de resultado).
 *
 * Determinístico e auditável (Documento 08): projeta o desfecho provável a
 * partir do ritmo REAL medido nos acompanhamentos e compara com a meta do plano
 * (Definição Estratégica). Recalibra a cada novo registro — quanto mais dados,
 * maior a confiança. Nenhuma IA.
 *
 * Liga a ponta do plano (Sprint C — projeção estática, antes de qualquer dado)
 * à ponta da realidade (a evolução medida), fechando o loop de inteligência.
 */

import { PREDICTION } from "@/modules/follow-ups/constants/parameters";
import type { EnergyDirection } from "@/modules/strategy/types";
import type { OutcomePrediction, PredictionVerdict } from "@/modules/follow-ups/types";

export interface OutcomePredictionInput {
  direction: EnergyDirection;
  startWeightKg: number;
  /** Meta de mudança (kg, magnitude) e prazo (semanas) — da Definição Estratégica. */
  targetChangeKg: number | null;
  targetWeeks: number | null;
  /** Ritmo real medido (kg/semana, sinalizado; negativo = perda). */
  realWeeklyKg: number | null;
  weeksElapsed: number;
  dataPoints: number;
}

const round = (value: number, decimals = 1) => {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
};
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Confiança 0–100: satura com nº de acompanhamentos e semanas decorridas. */
function confidence(dataPoints: number, weeksElapsed: number): number {
  const p =
    (Math.min(dataPoints, PREDICTION.confidencePointsCap) / PREDICTION.confidencePointsCap) *
    PREDICTION.confidencePointsWeight;
  const w =
    (Math.min(weeksElapsed, PREDICTION.confidenceWeeksCap) / PREDICTION.confidenceWeeksCap) *
    PREDICTION.confidenceWeeksWeight;
  return Math.round(clamp(p + w, 0, 100));
}

function verdictOf(
  onTrackPct: number,
  realWeeklyKg: number,
  plannedChangeKg: number,
): PredictionVerdict {
  const goalDir = Math.sign(plannedChangeKg);
  const realDir = Math.sign(realWeeklyKg);
  if (Math.abs(realWeeklyKg) <= PREDICTION.stallWeeklyKg) return "stalled";
  if (realDir !== 0 && realDir !== goalDir) return "reversing";
  if (onTrackPct < PREDICTION.behindBelowPct) return "behind";
  if (onTrackPct > PREDICTION.aheadAbovePct) return "ahead";
  return "on_track";
}

function detailFor(verdict: PredictionVerdict, gapKg: number, weeksToGoal: number | null): string {
  const gap = Math.abs(round(gapKg));
  const weeks = weeksToGoal === null ? null : Math.max(0, Math.ceil(weeksToGoal));
  switch (verdict) {
    case "ahead":
      return "No ritmo atual, a meta chega antes do prazo. Ótimo — vigie fome, energia e massa magra para não acelerar demais.";
    case "on_track":
      return weeks !== null
        ? `No ritmo atual, a meta é atingida em ~${weeks} semanas, dentro do prazo. Manter o plano e reavaliar na próxima janela.`
        : "O ritmo atual está alinhado com a meta no prazo. Manter o plano.";
    case "behind":
      return `No ritmo atual, faltarão ~${gap} kg para a meta no prazo. Antes de cortar calorias, revisar aderência e a real ingestão; se confirmado, ajustar conforme o plano.`;
    case "stalled":
      return "O peso praticamente não se moveu. Conforme o plano de ajustes: após 2+ semanas estagnado, reduzir ~10% das calorias ou aumentar o gasto.";
    case "reversing":
      return "A tendência está indo na direção oposta à meta. Revisar aderência ao cardápio e a ingestão real antes de mexer nos macros.";
    default:
      return "Ainda sem dados suficientes para prever. Registre alguns acompanhamentos com dias de intervalo.";
  }
}

/**
 * Projeta o resultado. Retorna null quando não há meta definida (Definição
 * Estratégica) ou a direção é de manutenção — casos em que não há o que prever.
 */
export function predictOutcome(input: OutcomePredictionInput): OutcomePrediction | null {
  const { direction, targetChangeKg, targetWeeks } = input;
  if (direction === "manutencao") return null;
  if (!targetChangeKg || targetChangeKg <= 0 || !targetWeeks || targetWeeks <= 0) return null;

  // Meta sinalizada: perda é negativa, ganho é positivo.
  const plannedChangeKg = direction === "deficit" ? -targetChangeKg : targetChangeKg;

  // Sem ritmo medido ainda (poucos dias/pontos): previsão insuficiente.
  if (input.realWeeklyKg === null) {
    return {
      realWeeklyKg: null,
      projectedChangeKg: 0,
      projectedWeightAtTarget: round(input.startWeightKg),
      plannedChangeKg: round(plannedChangeKg),
      targetWeeks,
      onTrackPct: 0,
      weeksToGoal: null,
      gapKg: round(Math.abs(plannedChangeKg)),
      verdict: "insufficient",
      confidence: confidence(input.dataPoints, input.weeksElapsed),
      detail: detailFor("insufficient", plannedChangeKg, null),
    };
  }

  const realWeeklyKg = input.realWeeklyKg;
  const projectedChangeKg = realWeeklyKg * targetWeeks;
  const projectedWeightAtTarget = input.startWeightKg + projectedChangeKg;
  const onTrackPct =
    plannedChangeKg !== 0 ? Math.round((projectedChangeKg / plannedChangeKg) * 100) : 0;
  // Semanas até a meta só fazem sentido se o ritmo vai na direção certa.
  const sameDirection = Math.sign(realWeeklyKg) === Math.sign(plannedChangeKg);
  const weeksToGoal =
    sameDirection && realWeeklyKg !== 0 ? round(plannedChangeKg / realWeeklyKg, 0) : null;
  const gapKg = Math.abs(plannedChangeKg) - Math.abs(projectedChangeKg);
  const verdict = verdictOf(onTrackPct, realWeeklyKg, plannedChangeKg);

  return {
    realWeeklyKg: round(realWeeklyKg, 2),
    projectedChangeKg: round(projectedChangeKg),
    projectedWeightAtTarget: round(projectedWeightAtTarget),
    plannedChangeKg: round(plannedChangeKg),
    targetWeeks,
    onTrackPct,
    weeksToGoal,
    gapKg: round(gapKg),
    verdict,
    confidence: confidence(input.dataPoints, input.weeksElapsed),
    detail: detailFor(verdict, gapKg, weeksToGoal),
  };
}
