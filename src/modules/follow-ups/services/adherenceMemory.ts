/**
 * Memória de Aderência (Personal Nutrition AI — Fatia C). "Nunca aja como se
 * fosse a primeira consulta": o histórico de acompanhamentos passa a moldar o
 * cardápio e o parecer.
 *
 * Adaptações SEGURAS (saciedade/praticidade) são aplicadas automaticamente — pois
 * só facilitam a adesão. Mudanças de caloria/ritmo são apenas SUGERIDAS ao
 * treinador (nunca silenciosamente aplicadas — Documento 02: decisão com quem
 * conduz). Determinístico (Documento 08).
 */

import { ADHERENCE_MEMORY_THRESHOLDS, STATUS_LABELS } from "@/modules/follow-ups/constants/parameters";
import type { Evolution, FollowUp } from "@/modules/follow-ups/types";

/** Sinais do histórico que ajustam a montagem do cardápio (adaptações seguras). */
export interface AdherenceSignals {
  checkInCount: number;
  avgAdherence: number | null;
  avgHunger: number | null;
  emphasizeSatiety: boolean;
  emphasizePracticality: boolean;
}

/** Narrativa da memória para o parecer — o que o histórico ensinou. */
export interface MemoryNarrative {
  hasHistory: boolean;
  headline: string;
  /** Como o histórico moldou o plano (adaptações seguras já aplicadas). */
  notes: string[];
  whatWorked: string[];
  whatFailed: string[];
  /** Sugestão de ajuste de ritmo/caloria — decisão do treinador. */
  recommendation: string | null;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
/** Número em pt-BR: vírgula decimal, sem casa desnecessária ("8", "4,5"). */
const br1 = (n: number) => (Number.isInteger(n) ? String(n) : String(n).replace(".", ","));
/** Número com casas fixas em pt-BR ("0,50"). */
const brFixed = (n: number, digits: number) => n.toFixed(digits).replace(".", ",");

/**
 * Extrai os sinais seguros do histórico (sem depender de macros/estratégia): só
 * das escalas subjetivas dos acompanhamentos. Usado para adaptar o cardápio.
 */
export function summarizeAdherenceSignals(followUps: FollowUp[]): AdherenceSignals {
  if (followUps.length === 0) {
    return {
      checkInCount: 0,
      avgAdherence: null,
      avgHunger: null,
      emphasizeSatiety: false,
      emphasizePracticality: false,
    };
  }
  const mean = (select: (f: FollowUp) => number) =>
    followUps.reduce((sum, f) => sum + select(f), 0) / followUps.length;
  const avgAdherence = round1(mean((f) => f.scales.adherence));
  const avgHunger = round1(mean((f) => f.scales.hunger));
  return {
    checkInCount: followUps.length,
    avgAdherence,
    avgHunger,
    emphasizePracticality: avgAdherence <= ADHERENCE_MEMORY_THRESHOLDS.lowAdherence,
    emphasizeSatiety: avgHunger >= ADHERENCE_MEMORY_THRESHOLDS.highHunger,
  };
}

/** Sugestão de ritmo a partir do status da evolução (real × previsto). */
function paceRecommendation(evolution: Evolution | null): string | null {
  if (!evolution || evolution.status === "insufficient") return null;
  const real = evolution.actualWeeklyKg;
  const exp = evolution.expectedWeeklyKg;
  const rates =
    real !== null
      ? ` (real ${brFixed(Math.abs(real), 2)} vs previsto ${brFixed(Math.abs(exp), 2)} kg/sem)`
      : "";
  switch (evolution.status) {
    case "on_track":
      return "Evolução no ritmo previsto — manter o plano e seguir acompanhando.";
    case "slow":
    case "stalled":
      return `Evolução abaixo do previsto${rates}. Se persistir por mais um acompanhamento, ajuste as calorias com o treinador.`;
    case "fast":
      return `Evolução acima do previsto${rates}. Dá para afrouxar um pouco, sobretudo se a fome pesar.`;
    case "reversing":
      return `Peso na direção contrária ao objetivo${rates}. Revisar calorias e adesão com prioridade.`;
    default:
      return null;
  }
}

function collect(followUps: FollowUp[], select: (f: FollowUp) => string | null): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  // Mais recentes primeiro.
  for (let i = followUps.length - 1; i >= 0; i--) {
    const value = select(followUps[i])?.trim();
    if (!value || seen.has(value.toLowerCase())) continue;
    seen.add(value.toLowerCase());
    out.push(value);
    if (out.length >= ADHERENCE_MEMORY_THRESHOLDS.maxLearnings) break;
  }
  return out;
}

/**
 * Constrói a narrativa da memória para o parecer. Reúne os sinais seguros já
 * aplicados, as anotações de "funcionou/não funcionou" do treinador e a
 * sugestão de ritmo (quando há evolução calculada).
 */
export function buildMemoryNarrative(
  followUps: FollowUp[],
  evolution: Evolution | null,
): MemoryNarrative {
  const signals = summarizeAdherenceSignals(followUps);
  if (signals.checkInCount === 0) {
    return {
      hasHistory: false,
      headline:
        "Primeira consulta — ainda sem histórico. O plano parte da anamnese; a partir do primeiro acompanhamento, o parecer passa a aprender.",
      notes: [],
      whatWorked: [],
      whatFailed: [],
      recommendation: null,
    };
  }

  const notes: string[] = [];
  if (signals.emphasizePracticality)
    notes.push(
      `Aderência média de ${br1(signals.avgAdherence ?? 0)}/10 nos ${signals.checkInCount} acompanhamentos — simplificamos o cardápio (mais praticidade) para facilitar seguir.`,
    );
  if (signals.emphasizeSatiety)
    notes.push(
      `Fome média de ${br1(signals.avgHunger ?? 0)}/10 — reforçamos alimentos saciantes para segurar a fome.`,
    );
  if (notes.length === 0)
    notes.push(
      `Aderência (${br1(signals.avgAdherence ?? 0)}/10) e fome (${br1(signals.avgHunger ?? 0)}/10) sob controle — mantivemos a estrutura que vem funcionando.`,
    );

  const statusLabel = evolution ? STATUS_LABELS[evolution.status] : null;
  const headline =
    `${signals.checkInCount} ${signals.checkInCount === 1 ? "acompanhamento registrado" : "acompanhamentos registrados"}` +
    (statusLabel ? ` — evolução ${statusLabel.toLowerCase()}.` : ".");

  return {
    hasHistory: true,
    headline,
    notes,
    whatWorked: collect(followUps, (f) => f.whatWorked),
    whatFailed: collect(followUps, (f) => f.whatFailed),
    recommendation: paceRecommendation(evolution),
  };
}
