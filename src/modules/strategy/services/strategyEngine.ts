/**
 * Strategic Prescription Engine (Documento 04) — as 12 etapas da estratégia.
 *
 * Determinístico e auditável (Documento 08 — regra, não IA): a partir dos
 * scores do diagnóstico, das respostas e do objetivo, constrói a Estratégia
 * Nutricional inteira, cada decisão acompanhada da justificativa técnica.
 * "A estratégia vem antes da matemática."
 */

import { STUDENT_GOAL_LABELS } from "@/modules/students/constants";
import type { StudentGoal } from "@/modules/students/types";
import type { AnswerMap, ScoreKey } from "@/modules/diagnosis/types";
import {
  FLEXIBILITY_LABELS,
  GOAL_DIRECTION,
  MEALS_BASE,
  MEALS_MAX,
  MEALS_MIN,
  PHILOSOPHY_LABELS,
  SCORE_THRESHOLDS,
  VELOCITY_LABELS,
  VELOCITY_THRESHOLDS,
} from "@/modules/strategy/constants/parameters";
import type {
  EnergyDirection,
  FlexibilityLevel,
  FoodPhilosophy,
  NutritionStrategy,
  StrategyDecision,
  StrategyVelocity,
} from "@/modules/strategy/types";

type Scores = Record<ScoreKey, number>;

/** Capacidade de execução: quanto o aluno aguenta de intensidade agora. */
function executionCapacity(s: Scores): number {
  return s.adherence + s.consistency - s.abandonmentRisk;
}

/** Etapa 2 — Velocidade, sempre limitada pelo risco de abandono. */
function decideVelocity(s: Scores, answers: AnswerMap): StrategyVelocity {
  const capacity = executionCapacity(s);
  const urgent = answers.timeline === "urgente" || answers.has_event === "sim";

  // Segurança primeiro: alto risco ou perfil tudo-ou-nada nunca vai ao topo.
  const fragile =
    s.abandonmentRisk >= VELOCITY_THRESHOLDS.highAbandonmentRisk ||
    s.flexibility <= VELOCITY_THRESHOLDS.lowFlexibility;

  if (fragile) return urgent ? "conservadora" : "muito_conservadora";

  if (capacity >= VELOCITY_THRESHOLDS.highCapacity) {
    return urgent ? "agressiva" : "intensiva";
  }
  if (capacity <= VELOCITY_THRESHOLDS.lowCapacity) {
    return "conservadora";
  }
  return urgent ? "intensiva" : "moderada";
}

/** Etapa 3 — Filosofia alimentar com maior probabilidade de aderência. */
function decidePhilosophy(s: Scores): FoodPhilosophy {
  const lowExecutiveLoad = s.organization <= SCORE_THRESHOLDS.low || s.practicality <= SCORE_THRESHOLDS.low;
  const highControl = s.organization >= SCORE_THRESHOLDS.high && s.flexibility >= SCORE_THRESHOLDS.high;

  if (lowExecutiveLoad) return "plano_tradicional";
  if (highControl) return "contagem_macros";
  if (s.flexibility <= SCORE_THRESHOLDS.mid) return "metodo_porcoes";
  return "hibrida";
}

/** Etapa 4 — Flexibilidade prescrita. */
function decideFlexibility(s: Scores): FlexibilityLevel {
  if (s.flexibility <= SCORE_THRESHOLDS.low) return "planejada";
  if (s.flexibility >= SCORE_THRESHOLDS.high) return "alta";
  return "moderada";
}

/** Etapa 5 — Nº de refeições que maximiza aderência (não o "ideal teórico"). */
function decideMeals(s: Scores, answers: AnswerMap): number {
  let meals = MEALS_BASE;
  // Fome mal controlada: distribuir saciedade em mais refeições.
  if (s.hungerControl <= SCORE_THRESHOLDS.low) meals += 1;
  // Rotina sem tempo/cozinha: menos refeições é mais sustentável.
  if (s.practicality <= SCORE_THRESHOLDS.low || answers.cook_availability === "quase_nunca") {
    meals -= 1;
  }
  return Math.max(MEALS_MIN, Math.min(MEALS_MAX, meals));
}

function directionText(direction: EnergyDirection): string {
  if (direction === "deficit") return "déficit calórico";
  if (direction === "superavit") return "superávit calórico";
  return "manutenção calórica";
}

/** Monta o objeto de decisão (DecisionCard) de cada etapa. */
function makeDecision(
  d: Omit<StrategyDecision, "benefits" | "risks" | "alternatives"> &
    Partial<Pick<StrategyDecision, "benefits" | "risks" | "alternatives">>,
): StrategyDecision {
  return { benefits: [], risks: [], alternatives: [], ...d };
}

/**
 * Constrói a Estratégia Nutricional completa a partir do diagnóstico.
 * Todas as decisões são regras auditáveis — nada de achismo.
 */
export function buildStrategy(
  goal: StudentGoal,
  scores: Scores,
  answers: AnswerMap,
): NutritionStrategy {
  const direction = GOAL_DIRECTION[goal];
  const velocity = decideVelocity(scores, answers);
  const philosophy = decidePhilosophy(scores);
  const flexibility = decideFlexibility(scores);
  const mealsPerDay = decideMeals(scores, answers);

  const decisions: StrategyDecision[] = [];

  // Etapa 1 — Objetivo
  decisions.push(
    makeDecision({
      id: "goal",
      step: 1,
      title: "Objetivo principal",
      decision: STUDENT_GOAL_LABELS[goal],
      reason: `Um único objetivo prioritário orienta todas as decisões seguintes. A direção energética será de ${directionText(direction)}.`,
      benefits: ["Clareza de foco", "Evita metas conflitantes"],
    }),
  );

  // Etapa 2 — Velocidade
  const capacity = executionCapacity(scores);
  decisions.push(
    makeDecision({
      id: "velocity",
      step: 2,
      title: "Velocidade",
      decision: VELOCITY_LABELS[velocity],
      reason:
        scores.abandonmentRisk >= VELOCITY_THRESHOLDS.highAbandonmentRisk ||
        scores.flexibility <= VELOCITY_THRESHOLDS.lowFlexibility
          ? `Risco de abandono (${scores.abandonmentRisk}) e/ou baixa flexibilidade (${scores.flexibility}) pedem cautela: proteger a aderência vale mais do que acelerar.`
          : `Capacidade de execução estimada em ${capacity} (aderência ${scores.adherence} + consistência ${scores.consistency} − risco ${scores.abandonmentRisk}) sustenta este ritmo.`,
      benefits: velocity === "conservadora" || velocity === "muito_conservadora"
        ? ["Menor chance de desistência", "Resultado sustentável"]
        : ["Resultado visível mais rápido", "Aproveita a janela de motivação"],
      risks: velocity === "intensiva" || velocity === "agressiva"
        ? ["Maior fome e fadiga — monitorar de perto e desacelerar se a aderência cair"]
        : [],
      alternatives: ["Ritmos mais rápidos foram descartados quando o risco de abandono era alto"],
    }),
  );

  // Etapa 3 — Filosofia alimentar
  const philosophyReason: Record<FoodPhilosophy, string> = {
    plano_tradicional:
      "Baixa organização/praticidade pedem um plano pronto, sem contas — menor carga cognitiva no dia a dia.",
    metodo_porcoes:
      "O método das porções dá estrutura visual sem exigir pesar tudo — bom equilíbrio entre controle e simplicidade.",
    contagem_macros:
      "Boa organização e abertura alimentar permitem a flexibilidade da contagem de macros sem perder o controle.",
    contagem_calorias: "Controle simples por calorias, adequado ao perfil.",
    hibrida:
      "Uma abordagem híbrida (estrutura + liberdade) tende a maximizar aderência neste perfil intermediário.",
  };
  decisions.push(
    makeDecision({
      id: "philosophy",
      step: 3,
      title: "Filosofia alimentar",
      decision: PHILOSOPHY_LABELS[philosophy],
      reason: philosophyReason[philosophy],
      benefits: ["Escolhida pela aderência provável, não pela teoria"],
    }),
  );

  // Etapa 4 — Flexibilidade
  const flexReason: Record<FlexibilityLevel, string> = {
    planejada: `Flexibilidade baixa (${scores.flexibility}) com traço tudo-ou-nada: liberdade precisa ser planejada para não virar recaída.`,
    baixa: "Perfil que responde bem a regras firmes no início.",
    moderada: `Flexibilidade intermediária (${scores.flexibility}) comporta ajustes pontuais sem perder o rumo.`,
    alta: `Boa flexibilidade (${scores.flexibility}) permite liberdade com autorregulação.`,
  };
  decisions.push(
    makeDecision({
      id: "flexibility",
      step: 4,
      title: "Flexibilidade",
      decision: FLEXIBILITY_LABELS[flexibility],
      reason: flexReason[flexibility],
    }),
  );

  // Etapa 5 — Frequência alimentar
  decisions.push(
    makeDecision({
      id: "meals",
      step: 5,
      title: "Frequência alimentar",
      decision: `${mealsPerDay} refeições/dia`,
      reason:
        scores.hungerControl <= SCORE_THRESHOLDS.low
          ? `Controle de fome baixo (${scores.hungerControl}): distribuir a saciedade em mais refeições ajuda a sustentar o plano.`
          : scores.practicality <= SCORE_THRESHOLDS.low
            ? `Rotina pouco prática (${scores.practicality}): menos refeições são mais fáceis de manter.`
            : "Número escolhido para maximizar aderência, não o ideal teórico.",
    }),
  );

  // Etapa 6 — Estratégia da fome
  const hungerTactics: string[] = [];
  if (scores.hungerControl <= SCORE_THRESHOLDS.mid)
    hungerTactics.push("Proteína alta em todas as refeições", "Maior volume alimentar (vegetais, saladas)");
  if (answers.sweets === "gatilho") hungerTactics.push("Reduzir gatilhos de doce em casa");
  if (answers.night_eating === "frequente")
    hungerTactics.push("Concentrar mais calorias à noite, quando a fome aparece");
  if (hungerTactics.length === 0) hungerTactics.push("Distribuição equilibrada de fibras e proteína");
  decisions.push(
    makeDecision({
      id: "hunger",
      step: 6,
      title: "Estratégia da fome",
      decision: hungerTactics[0],
      reason: `Controle de fome em ${scores.hungerControl}. A saciedade é tratada por comida antes de qualquer restrição.`,
      benefits: hungerTactics.slice(1),
    }),
  );

  // Etapa 7 — Finais de semana
  const weekendPlanned = scores.flexibility <= SCORE_THRESHOLDS.low || answers.all_or_nothing;
  decisions.push(
    makeDecision({
      id: "weekend",
      step: 7,
      title: "Finais de semana",
      decision: weekendPlanned
        ? "1–2 refeições livres planejadas, com estrutura ao redor"
        : "Manutenção flexível, sem culpa",
      reason: weekendPlanned
        ? "Perfil tudo-ou-nada: a liberdade do fim de semana precisa de moldura para não descarrilar a semana."
        : "Boa flexibilidade permite fins de semana livres sem comprometer o resultado.",
      risks: weekendPlanned ? ["Sem planejamento, o fim de semana apaga o progresso da semana"] : [],
    }),
  );

  // Etapa 8 — Eventos sociais
  decisions.push(
    makeDecision({
      id: "social",
      step: 8,
      title: "Eventos sociais",
      decision: "Priorizar proteína, controlar líquidos calóricos, sem compensação punitiva",
      reason:
        "Aniversários, viagens e restaurantes fazem parte da vida — a estratégia os inclui em vez de proibir.",
      benefits: ["Vida social preservada", "Sem ciclo culpa-restrição"],
    }),
  );

  // Etapa 9 — Dias difíceis
  const hardDaysNeedsKit =
    scores.practicality <= SCORE_THRESHOLDS.mid ||
    answers.cook_availability === "quase_nunca" ||
    answers.work_location === "externo";
  decisions.push(
    makeDecision({
      id: "hard_days",
      step: 9,
      title: "Dias difíceis",
      decision: hardDaysNeedsKit
        ? "Kit de emergência: opções prontas e marmitas congeladas"
        : "Versão mínima do plano para dias corridos",
      reason: hardDaysNeedsKit
        ? "Rotina com pouca praticidade exige um plano B pronto para dias sem tempo ou cozinha."
        : "Mesmo com boa rotina, é preciso uma versão simplificada para plantões e imprevistos.",
    }),
  );

  // Etapa 10 — Suplementação (parte da dificuldade, nunca do suplemento)
  const supplementDecision = decideSupplementation(scores, answers);
  decisions.push(supplementDecision);

  // Etapa 11 — Plano B
  decisions.push(
    makeDecision({
      id: "plan_b",
      step: 11,
      title: "Plano B",
      decision: "Mínimo viável: proteína em toda refeição + caminhada diária",
      reason:
        "Se o plano principal falhar, o aluno nunca fica sem estratégia — há sempre um piso simples que mantém o progresso.",
      benefits: ["Nunca ficar sem rumo", "Fácil de retomar após uma recaída"],
    }),
  );

  // Etapa 12 — Plano de ajustes
  const fast = velocity === "intensiva" || velocity === "agressiva";
  decisions.push(
    makeDecision({
      id: "adjustments",
      step: 12,
      title: "Plano de ajustes",
      decision: fast ? "Revisão a cada 2 semanas" : "Revisão a cada 3–4 semanas",
      reason:
        "Quando revisar, manter, reduzir ou aumentar calorias fica definido de antemão — o ajuste segue dados, não ansiedade.",
      benefits: [
        "Reduzir calorias só após estagnação real (2+ semanas)",
        direction === "deficit"
          ? "Considerar diet break/refeed se a aderência ou a fome piorarem"
          : "Ajustar o superávit conforme o ganho de peso semanal",
      ],
    }),
  );

  return { goal, velocity, direction, philosophy, flexibility, mealsPerDay, decisions };
}

/** Etapa 10 — parte da dificuldade a resolver, respeitando abertura e orçamento. */
function decideSupplementation(s: Scores, answers: AnswerMap): StrategyDecision {
  const open = answers.supplement_openness;
  if (open === "nao") {
    return makeDecision({
      id: "supplements",
      step: 10,
      title: "Suplementação",
      decision: "Sem suplementos por ora — resolver tudo pela comida",
      reason: "O aluno prefere evitar suplementos; nenhuma dificuldade atual exige um.",
    });
  }

  const difficulties: string[] = [];
  if (s.hungerControl <= SCORE_THRESHOLDS.low) difficulties.push("saciedade");
  if (s.practicality <= SCORE_THRESHOLDS.low) difficulties.push("praticidade da proteína");

  const budgetTight = answers.budget === "apertado" || open === "depende";
  const decision = difficulties.length
    ? budgetTight
      ? "Avaliar whey só se a proteína da comida não fechar (custo-benefício)"
      : "Whey como facilitador de proteína prática"
    : "Nenhum suplemento necessário agora";

  return makeDecision({
    id: "supplements",
    step: 10,
    title: "Suplementação",
    decision,
    reason: difficulties.length
      ? `Primeiro a dificuldade (${difficulties.join(", ")}), depois — e só se ajudar — o suplemento.`
      : "Nenhuma dificuldade atual justifica suplementação; começa pela comida.",
    alternatives: ["Suplementos que não resolvem uma dificuldade concreta foram descartados"],
  });
}
