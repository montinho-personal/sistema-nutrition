/**
 * Motor de Evolução dos Acompanhamentos (Documento 03F — previsão × real;
 * Documento 05 — aprendizado). Determinístico e auditável (Documento 08).
 *
 * Compara o ritmo real de mudança de peso com o ritmo esperado (derivado dos
 * macros) e gera recomendações ligadas ao plano de ajustes (Documento 04,
 * Etapa 12).
 */

import type { EnergyDirection } from "@/modules/strategy/types";
import {
  KCAL_PER_KG,
  MAINTENANCE_TOLERANCE_KG,
  MIN_DAYS_FOR_RATE,
  RATE_BANDS,
  SCALE_LABELS,
  SCALE_THRESHOLDS,
  SURPLUS_GAIN_FACTOR,
} from "@/modules/follow-ups/constants/parameters";
import type {
  Evolution,
  EvolutionInsight,
  EvolutionStatus,
  FollowUp,
  FollowUpScales,
  WeightPoint,
} from "@/modules/follow-ups/types";

const SCALE_KEYS: (keyof FollowUpScales)[] = ["adherence", "hunger", "sleep", "energy", "mood"];

/** Dias entre duas datas ISO (yyyy-mm-dd). */
function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return (to - from) / (1000 * 60 * 60 * 24);
}

function round(value: number, decimals = 1): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

/**
 * Ritmo esperado (kg/semana, sinalizado) a partir dos macros. Perda é negativa.
 * Déficit → perda proporcional; superávit → ganho amortecido pelo fator.
 */
export function expectedWeeklyKgFromMacros(
  direction: EnergyDirection,
  tdee: number,
  calories: number,
): number {
  if (direction === "deficit") return -((tdee - calories) * 7) / KCAL_PER_KG;
  if (direction === "superavit") {
    return (((calories - tdee) * 7) / KCAL_PER_KG) * SURPLUS_GAIN_FACTOR;
  }
  return 0;
}

/** Média dos indicadores subjetivos dos acompanhamentos (ou null). */
function averageScales(followups: FollowUp[]): FollowUpScales | null {
  if (followups.length === 0) return null;
  const sum: FollowUpScales = { adherence: 0, hunger: 0, sleep: 0, energy: 0, mood: 0 };
  for (const f of followups) {
    for (const key of SCALE_KEYS) sum[key] += f.scales[key];
  }
  const avg = {} as FollowUpScales;
  for (const key of SCALE_KEYS) avg[key] = round(sum[key] / followups.length, 1);
  return avg;
}

/** Classifica o status comparando ritmo real e esperado. */
function classifyStatus(
  actualWeeklyKg: number | null,
  expectedWeeklyKg: number,
): EvolutionStatus {
  if (actualWeeklyKg === null) return "insufficient";

  // Manutenção: estabilidade dentro da tolerância.
  if (expectedWeeklyKg === 0) {
    return Math.abs(actualWeeklyKg) <= MAINTENANCE_TOLERANCE_KG ? "on_track" : "fast";
  }

  const expectedDir = Math.sign(expectedWeeklyKg);
  const actualDir = Math.sign(actualWeeklyKg);
  // Movendo na direção contrária ao objetivo.
  if (actualDir !== 0 && actualDir !== expectedDir) return "reversing";

  const ratio = actualWeeklyKg / expectedWeeklyKg; // ambos mesmo sinal → positivo
  if (ratio < RATE_BANDS.stalledBelow) return "stalled";
  if (ratio < RATE_BANDS.slowBelow) return "slow";
  if (ratio > RATE_BANDS.fastAbove) return "fast";
  return "on_track";
}

/**
 * Sintetiza a evolução do aluno a partir do peso inicial (baseline da
 * estratégia) e dos acompanhamentos registrados.
 */
export function computeEvolution(
  startWeight: number,
  startDate: string,
  followups: FollowUp[],
  expectedWeeklyKg: number,
): Evolution {
  const sorted = [...followups].sort((a, b) => a.date.localeCompare(b.date));
  const points: WeightPoint[] = [
    { date: startDate, weightKg: startWeight },
    ...sorted.map((f) => ({ date: f.date, weightKg: f.weightKg })),
  ];

  const last = sorted[sorted.length - 1] ?? null;
  const previous = sorted.length >= 2 ? sorted[sorted.length - 2] : null;
  const currentWeight = last?.weightKg ?? startWeight;
  const previousWeight = previous?.weightKg ?? (last ? startWeight : null);

  const totalChangeKg = round(currentWeight - startWeight, 1);
  const lastChangeKg =
    last && previousWeight !== null ? round(currentWeight - previousWeight, 1) : null;

  const days = last ? daysBetween(startDate, last.date) : 0;
  const weeksElapsed = round(days / 7, 1);
  const actualWeeklyKg =
    last && days >= MIN_DAYS_FOR_RATE ? round((currentWeight - startWeight) / (days / 7), 2) : null;

  return {
    startWeight,
    currentWeight,
    previousWeight,
    totalChangeKg,
    lastChangeKg,
    weeksElapsed,
    actualWeeklyKg,
    expectedWeeklyKg: round(expectedWeeklyKg, 2),
    status: classifyStatus(actualWeeklyKg, expectedWeeklyKg),
    points,
    averageScales: averageScales(followups),
  };
}

/**
 * Recomendações determinísticas a partir da evolução — ligadas ao plano de
 * ajustes (Documento 04, Etapa 12) e ao aprendizado (Documento 05).
 */
export function buildEvolutionInsights(evolution: Evolution): EvolutionInsight[] {
  const insights: EvolutionInsight[] = [];
  const losing = evolution.expectedWeeklyKg < 0;

  switch (evolution.status) {
    case "stalled":
      insights.push({
        id: "stalled",
        kind: "risk",
        title: "Progresso estagnou",
        detail: losing
          ? "Ritmo bem abaixo do previsto. Conforme o plano de ajustes: revisar após 2+ semanas — reduzir ~10% das calorias ou aumentar o gasto."
          : "Ganho abaixo do previsto — considerar pequeno aumento calórico.",
      });
      break;
    case "reversing":
      insights.push({
        id: "reversing",
        kind: "risk",
        title: "Tendência contrária ao objetivo",
        detail:
          "O peso está indo na direção oposta à esperada. Revisar aderência ao cardápio e a real ingestão antes de mudar os macros.",
      });
      break;
    case "fast":
      insights.push({
        id: "fast",
        kind: "recommendation",
        title: "Ritmo acima do previsto",
        detail: losing
          ? "Perda rápida: vigiar fome, energia e massa magra. Considerar diet break/refeed se a aderência ou a energia caírem."
          : "Ganho acima do previsto: atenção ao ganho de gordura; avaliar reduzir o superávit.",
      });
      break;
    case "slow":
      insights.push({
        id: "slow",
        kind: "recommendation",
        title: "Um pouco abaixo do esperado",
        detail:
          "Progresso existe, mas mais lento. Manter mais uma a duas semanas antes de ajustar — pode ser variação normal.",
      });
      break;
    case "on_track":
      insights.push({
        id: "on_track",
        kind: "opportunity",
        title: "No ritmo esperado",
        detail: "A resposta está alinhada à previsão. Manter o plano e reavaliar na próxima janela.",
      });
      break;
    default:
      insights.push({
        id: "insufficient",
        kind: "recommendation",
        title: "Ainda sem dados suficientes",
        detail: "Registre ao menos um acompanhamento com alguns dias de intervalo para avaliar o ritmo.",
      });
  }

  // Insights a partir dos indicadores subjetivos (Documento 05).
  const avg = evolution.averageScales;
  if (avg) {
    if (avg.adherence <= SCALE_THRESHOLDS.low) {
      insights.push({
        id: "low_adherence",
        kind: "risk",
        title: `${SCALE_LABELS.adherence} baixa`,
        detail: "Antes de restringir mais, simplificar o plano para elevar a adesão.",
      });
    }
    if (avg.hunger >= SCALE_THRESHOLDS.high) {
      insights.push({
        id: "high_hunger",
        kind: "recommendation",
        title: `${SCALE_LABELS.hunger} elevada`,
        detail: "Reforçar saciedade: mais proteína, volume alimentar e fibras antes de cortar calorias.",
      });
    }
    if (avg.energy <= SCALE_THRESHOLDS.low) {
      insights.push({
        id: "low_energy",
        kind: "recommendation",
        title: `${SCALE_LABELS.energy} baixa`,
        detail: "Energia baixa sustentada pede atenção ao sono, aos carboidratos e à magnitude do déficit.",
      });
    }
  }

  return insights;
}
