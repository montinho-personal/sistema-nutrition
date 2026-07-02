/**
 * Motor de hipóteses do diagnóstico (Documento 03A — Motor de Hipóteses).
 *
 * Regras determinísticas sobre respostas e scores. Cada hipótese traz
 * justificativa e nível de confiança (transparência — Documento 00).
 */

import { computeScoreMap } from "@/modules/diagnosis/services/scoringEngine";
import type { AnswerMap, Hypothesis, ScoreKey } from "@/modules/diagnosis/types";

interface Rule {
  id: string;
  dimension: Hypothesis["dimension"];
  when: (a: AnswerMap, s: Record<ScoreKey, number>) => boolean;
  title: string;
  justification: string;
  confidence: (a: AnswerMap, s: Record<ScoreKey, number>) => number;
}

const RULES: Rule[] = [
  {
    id: "sanfona_tudo_ou_nada",
    dimension: "risk",
    when: (a) =>
      a.weight_history === "sanfona" &&
      typeof a.all_or_nothing === "number" &&
      a.all_or_nothing >= 6,
    title: "Alto risco de abandono por mentalidade tudo-ou-nada",
    justification:
      "Histórico de efeito sanfona somado a um perfil tudo-ou-nada tende a transformar deslizes em desistência. Estratégia flexível e plano B são essenciais.",
    confidence: (a) =>
      80 + (typeof a.all_or_nothing === "number" ? Math.min(15, a.all_or_nothing) : 0),
  },
  {
    id: "fome_noturna",
    dimension: "difficulty",
    when: (a) =>
      (typeof a.hunger_level === "number" && a.hunger_level >= 7) || a.night_eating === "frequente",
    title: "O período noturno será o maior desafio",
    justification:
      "Fome intensa e/ou beliscos à noite pedem estratégias específicas de saciedade — proteína, fibras e volume alimentar concentrados no fim do dia.",
    confidence: (a) => (a.night_eating === "frequente" ? 90 : 82),
  },
  {
    id: "compulsao",
    dimension: "risk",
    when: (a) => a.compulsion === "frequente",
    title: "Compulsão exige abordagem comportamental antes de restringir",
    justification:
      "Com episódios frequentes de compulsão, reduzir calorias agressivamente aumenta o risco. Priorizar organização do ambiente e gatilhos primeiro.",
    confidence: () => 88,
  },
  {
    id: "praticidade_decisiva",
    dimension: "difficulty",
    when: (a, s) => s.practicality <= 40 || a.cook_availability === "quase_nunca",
    title: "Praticidade será decisiva para a aderência",
    justification:
      "Pouca disponibilidade para cozinhar torna marmitas, preparo antecipado e opções práticas o centro da estratégia.",
    confidence: (_, s) => 75 + (50 - Math.min(50, s.practicality)),
  },
  {
    id: "orcamento_restricao",
    dimension: "difficulty",
    when: (a) => a.budget === "apertado",
    title: "O custo será uma restrição importante",
    justification:
      "Orçamento apertado pede priorizar alimentos baratos e saciantes (ovos, feijão, arroz, frango) e evitar dependência de suplementos.",
    confidence: () => 85,
  },
  {
    id: "ambiente_desfavoravel",
    dimension: "risk",
    when: (a, s) => s.environment <= 40 || a.home_food === "tentacao",
    title: "Controlar o ambiente alimentar terá mais impacto que cortar calorias",
    justification:
      "Muita tentação em casa e baixo apoio minam a aderência. Ajustar o que está disponível costuma render mais que restringir.",
    confidence: (_, s) => 80 + (40 - Math.min(40, s.environment)),
  },
  {
    id: "motivacao_alta",
    dimension: "advantage",
    when: (_, s) => s.motivation >= 75,
    title: "Alta motivação é uma vantagem a aproveitar já",
    justification:
      "A motivação está elevada — o momento é ideal para construir pequenas vitórias rápidas que consolidem o hábito antes que ela oscile.",
    confidence: (_, s) => Math.min(95, s.motivation + 10),
  },
  {
    id: "disciplina_boa",
    dimension: "advantage",
    when: (_, s) => s.consistency >= 70 && s.adherence >= 65,
    title: "Boa disciplina favorece estratégias mais estruturadas",
    justification:
      "Consistência e aderência elevadas permitem um plano um pouco mais preciso, sem depender só de flexibilidade máxima.",
    confidence: (_, s) => Math.min(90, s.consistency + 10),
  },
  {
    id: "organizacao_gargalo",
    dimension: "opportunity",
    when: (_, s) => s.motivation >= 60 && s.organization <= 45,
    title: "Organização é o principal gargalo — e a maior oportunidade",
    justification:
      "Há motivação, mas falta planejamento. Introduzir um ritual simples de compras e preparo semanal deve destravar os resultados.",
    confidence: () => 82,
  },
  {
    id: "poucas_refeicoes",
    dimension: "opportunity",
    when: (a, s) =>
      s.practicality <= 45 && s.hungerControl >= 45 && a.cook_availability !== "facil",
    title: "Poucas refeições, maiores e saciantes, tendem a funcionar melhor",
    justification:
      "Com rotina corrida e fome sob controle, concentrar em menos refeições reduz a fricção e melhora a aderência.",
    confidence: () => 76,
  },
  {
    id: "sem_estrutura_refeicoes",
    dimension: "difficulty",
    when: (a) => a.meals_per_day === "beliscando",
    title: "Falta de estrutura nas refeições é o ponto de partida",
    justification:
      "Beliscar o dia todo, sem horários, dificulta perceber a fome real e o total ingerido. Definir refeições com começo, meio e fim tende a render mais que qualquer corte calórico.",
    confidence: () => 84,
  },
  {
    id: "gatilho_emocional",
    dimension: "risk",
    when: (a) =>
      Array.isArray(a.compulsion_trigger) &&
      (a.compulsion_trigger.includes("estresse") || a.compulsion_trigger.includes("emocoes")),
    title: "Comer é, em parte, uma válvula emocional",
    justification:
      "Os episódios são disparados por estresse ou emoções, não por fome. Restringir comida sem oferecer outra válvula costuma piorar — a estratégia precisa de plano para os momentos-gatilho.",
    confidence: () => 86,
  },
  {
    id: "hidratacao_baixa",
    dimension: "opportunity",
    when: (a) => a.water_intake === "menos_1l",
    title: "Aumentar a água é uma vitória rápida e fácil",
    justification:
      "Baixa hidratação se confunde com fome e reduz a saciedade. Subir a ingestão de água é um ajuste simples, de baixo custo, que ajuda no controle do apetite desde a primeira semana.",
    confidence: () => 78,
  },
  {
    id: "calorias_liquidas",
    dimension: "difficulty",
    when: (a) =>
      a.alcohol_frequency === "quase_diario" ||
      (Array.isArray(a.beverages) && a.beverages.includes("refrigerante")),
    title: "Calorias líquidas passam despercebidas e pesam no total",
    justification:
      "Refrigerante, suco adoçado ou álcool frequente somam calorias sem saciar. Ajustar as bebidas costuma abrir espaço calórico sem mexer no prato — um ganho com pouca perda percebida.",
    confidence: (a) => (a.alcohol_frequency === "quase_diario" ? 82 : 74),
  },
];

/** Gera as hipóteses ativas, ordenadas por confiança (Documento 03A). */
export function computeHypotheses(answers: AnswerMap): Hypothesis[] {
  const scores = computeScoreMap(answers);
  return RULES.filter((rule) => rule.when(answers, scores))
    .map((rule) => ({
      id: rule.id,
      dimension: rule.dimension,
      title: rule.title,
      justification: rule.justification,
      confidence: Math.max(0, Math.min(100, Math.round(rule.confidence(answers, scores)))),
    }))
    .sort((a, b) => b.confidence - a.confidence);
}
