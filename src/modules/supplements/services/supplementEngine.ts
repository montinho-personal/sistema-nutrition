/**
 * Motor de Suplementação (Documentos 00/04 Etapa 10; 03G).
 *
 * "Primeiro a dificuldade, depois o suplemento": para cada item do catálogo,
 * avalia se uma dificuldade concreta o justifica, sempre respeitando a abertura
 * do aluno e o orçamento. Determinístico e auditável (Documento 08).
 */

import { SCORE_THRESHOLDS } from "@/modules/strategy/constants/parameters";
import { SUPPLEMENT_CATALOG } from "@/modules/supplements/constants/catalog";
import { SLEEP_SHORT_HOURS, STATUS_ORDER } from "@/modules/supplements/constants/parameters";
import type {
  Supplement,
  SupplementContext,
  SupplementRecommendation,
  SupplementStatus,
} from "@/modules/supplements/types";

interface Trigger {
  triggered: boolean;
  /** Justificativa quando disparado. */
  when: string;
  /** Justificativa quando não disparado. */
  otherwise: string;
}

/** Regras de indicação por suplemento (a dificuldade que cada um resolve). */
const RULES: Record<string, (ctx: SupplementContext) => Trigger> = {
  creatine: (ctx) => ({
    triggered: ctx.trains === "regular" || ctx.trains === "irregular",
    when: "Treina com regularidade — creatina melhora força e recuperação.",
    otherwise: "Sem treino de força consistente, o benefício é pequeno.",
  }),
  whey: (ctx) => ({
    triggered: ctx.practicality <= SCORE_THRESHOLDS.low,
    when: "Praticidade baixa: fechar a proteína só pela comida é difícil na rotina.",
    otherwise: "Se a comida fecha a proteína, o whey é dispensável.",
  }),
  b12: (ctx) => ({
    triggered: ctx.restrictions.includes("vegano") || ctx.restrictions.includes("vegetariano"),
    when: "Dieta sem carne: a B12 precisa vir de suplemento (questão de saúde).",
    otherwise: "Com fontes animais na dieta, a suplementação não é necessária.",
  }),
  fiber: (ctx) => ({
    triggered: ctx.hungerControl <= SCORE_THRESHOLDS.low,
    when: "Controle de fome baixo: a fibra ajuda na saciedade.",
    otherwise: "Fome sob controle — priorizar a fibra dos alimentos.",
  }),
  omega3: (ctx) => ({
    triggered:
      ctx.healthConditions.includes("hipertensao") ||
      ctx.healthConditions.includes("diabetes") ||
      ctx.mealsOut === "quase_diario",
    when: "Baixo consumo de peixe e/ou condição cardiovascular — ômega-3 dá suporte.",
    otherwise: "Rotina e consumo de peixe não indicam necessidade agora.",
  }),
  caffeine: (ctx) => ({
    triggered: ctx.trains === "regular",
    when: "Treina regularmente: a cafeína pode elevar o desempenho.",
    otherwise: "Sem treino regular, não se justifica.",
  }),
  magnesium: (ctx) => ({
    triggered: ctx.sleepHours !== null && ctx.sleepHours < SLEEP_SHORT_HOURS,
    when: "Sono curto: o magnésio pode apoiar o relaxamento.",
    otherwise: "Sono adequado — não é necessário.",
  }),
};

/** Alto valor: evidência forte + ótimo custo-benefício (mantém-se recomendado). */
function isHighValue(supplement: Supplement): boolean {
  return supplement.evidence === "strong" && supplement.costBenefit === "high";
}

function resolveStatus(
  supplement: Supplement,
  triggered: boolean,
  ctx: SupplementContext,
): SupplementStatus {
  if (!triggered) return "not_needed";
  // O aluno prefere resolver só pela comida.
  if (ctx.openness === "nao") return "not_indicated";
  // Cautela por orçamento/abertura, exceto itens de alto valor.
  const cautious = ctx.budgetTight || ctx.openness === "depende";
  return cautious && !isHighValue(supplement) ? "consider" : "recommended";
}

/**
 * Avalia o catálogo para um aluno e devolve as recomendações ordenadas
 * (recomendados primeiro, depois avaliar, não indicado e não necessário).
 */
export function recommendSupplements(ctx: SupplementContext): SupplementRecommendation[] {
  return SUPPLEMENT_CATALOG.map((supplement) => {
    const rule = RULES[supplement.id];
    const trigger = rule
      ? rule(ctx)
      : { triggered: false, when: "", otherwise: "Sem indicação definida." };
    const status = resolveStatus(supplement, trigger.triggered, ctx);
    const reason =
      status === "not_indicated"
        ? `${trigger.when} Ainda assim, o aluno prefere resolver pela comida.`
        : trigger.triggered
          ? trigger.when
          : trigger.otherwise;
    return { supplement, status, reason };
  }).sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      a.supplement.priority - b.supplement.priority,
  );
}
