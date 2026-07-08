/**
 * Projeção de peso — plano × realidade (Documento 02: o aluno VÊ o destino).
 *
 * Constrói a série do gráfico do Relatório: a linha do plano (do peso inicial à
 * meta, no ritmo prescrito), a faixa esperada (flutuar dentro dela é normal —
 * não fracasso, proteção da aderência) e o caminho real dos acompanhamentos.
 * Determinística (Documento 08); os parâmetros vivem em `constants/parameters`.
 */

import type { EnergyDirection } from "@/modules/strategy/types";
import type { FollowUp } from "@/modules/follow-ups/types";
import { WEIGHT_PROJECTION } from "@/modules/follow-ups/constants/parameters";
import { expectedWeeklyKgFromMacros } from "@/modules/follow-ups/services/evolutionEngine";

/** Ritmo real ante o planejado no último registro. */
export type ProjectionPace =
  /** Dentro da faixa esperada. */
  | "on_track"
  /** Progresso menor que o previsto na direção do plano. */
  | "behind"
  /** Progresso maior que o previsto (atenção a fome/energia). */
  | "ahead"
  /** Manutenção: o peso saiu da faixa. */
  | "drift";

export interface WeightProjectionPoint {
  /** Semana desde o início (fracionária nos registros reais). */
  week: number;
  kg: number;
}

export interface WeightProjection {
  startKg: number;
  /** Peso projetado no fim do horizonte (a meta, quando definida). */
  endKg: number;
  /** Horizonte da projeção (semanas). */
  weeks: number;
  /** Ritmo semanal planejado, sinalizado (perda negativa). */
  weeklyKg: number;
  /** true quando o fim do horizonte é a meta da Definição Estratégica. */
  hasTarget: boolean;
  /** Linha do plano, semana a semana. */
  planned: WeightProjectionPoint[];
  /** Bordas da faixa esperada, semana a semana. */
  upper: WeightProjectionPoint[];
  lower: WeightProjectionPoint[];
  /** Pesos registrados (inclui a semana 0 com o peso inicial). */
  actual: WeightProjectionPoint[];
  /** Último registro real e o veredito do ritmo (null = sem registros). */
  last: { week: number; kg: number; pace: ProjectionPace | null } | null;
}

export interface WeightProjectionInput {
  startWeightKg: number;
  /** Data de início do plano (yyyy-mm-dd). */
  startDate: string;
  direction: EnergyDirection;
  tdee: number;
  calories: number;
  targetChangeKg?: number | null;
  targetWeeks?: number | null;
  followUps: FollowUp[];
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return (to - from) / (1000 * 60 * 60 * 24);
}

const round1 = (v: number) => Math.round(v * 10) / 10;

/** Monta a projeção completa para o gráfico plano × realidade. */
export function buildWeightProjection(input: WeightProjectionInput): WeightProjection {
  const P = WEIGHT_PROJECTION;
  const { startWeightKg: startKg, direction } = input;

  // Ritmo: a meta definida é o contrato (as calorias já derivam dela); sem
  // meta, o ritmo vem do balanço energético realmente prescrito.
  const hasTarget = Boolean(
    input.targetChangeKg && input.targetWeeks && direction !== "manutencao",
  );
  const sign = direction === "deficit" ? -1 : direction === "superavit" ? 1 : 0;
  const weeks = hasTarget ? input.targetWeeks! : P.defaultWeeks;
  const weeklyKg = hasTarget
    ? (sign * input.targetChangeKg!) / input.targetWeeks!
    : expectedWeeklyKgFromMacros(direction, input.tdee, input.calories);

  const plannedAt = (week: number) => startKg + weeklyKg * week;
  // Meia-largura da faixa: fração do progresso acumulado; na manutenção o
  // progresso planejado é zero, então a faixa é fixa.
  const halfBandAt = (week: number) =>
    weeklyKg === 0 ? P.maintenanceBandKg : Math.abs(weeklyKg * week) * P.bandPct;

  const planned: WeightProjectionPoint[] = [];
  const upper: WeightProjectionPoint[] = [];
  const lower: WeightProjectionPoint[] = [];
  for (let week = 0; week <= weeks; week++) {
    planned.push({ week, kg: plannedAt(week) });
    upper.push({ week, kg: plannedAt(week) + halfBandAt(week) });
    lower.push({ week, kg: plannedAt(week) - halfBandAt(week) });
  }

  const sorted = [...input.followUps].sort((a, b) => a.date.localeCompare(b.date));
  const actual: WeightProjectionPoint[] = [
    { week: 0, kg: startKg },
    ...sorted.map((f) => ({
      week: round1(Math.max(0, daysBetween(input.startDate, f.date)) / 7),
      kg: f.weightKg,
    })),
  ];

  const lastPoint = actual.length > 1 ? actual[actual.length - 1] : null;
  let last: WeightProjection["last"] = null;
  if (lastPoint) {
    const plannedChange = weeklyKg * lastPoint.week;
    const diff = lastPoint.kg - plannedAt(lastPoint.week);
    let pace: ProjectionPace | null;
    if (Math.abs(diff) <= halfBandAt(lastPoint.week)) {
      pace = "on_track";
    } else if (direction === "manutencao") {
      pace = "drift";
    } else if (Math.abs(plannedChange) < P.minPlannedChangeForVerdictKg) {
      // Cedo demais: a mudança planejada acumulada ainda é menor que a
      // flutuação diária normal — nenhum veredito honesto é possível.
      pace = null;
    } else {
      // diff na MESMA direção do plano (déficit: ainda mais leve) = "ahead";
      // na direção contrária (mais pesado que o previsto) = "behind".
      pace = diff * sign > 0 ? "ahead" : "behind";
    }
    last = { ...lastPoint, pace };
  }

  return {
    startKg,
    endKg: plannedAt(weeks),
    weeks,
    weeklyKg,
    hasTarget,
    planned,
    upper,
    lower,
    actual,
    last,
  };
}
