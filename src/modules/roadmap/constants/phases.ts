/**
 * As 7 fases da transformação (Documento 03E) e os parâmetros de avanço.
 *
 * Conteúdo fixo das fases + limiares de progressão (Documento 08 — nenhum
 * número mágico na lógica). O avanço nunca é só por tempo: depende de sinais
 * reais (diagnóstico, estratégia, acompanhamentos, evolução).
 */

import type { PhaseDescriptor, PhaseKey } from "@/modules/roadmap/types";

export const PHASE_DESCRIPTORS: PhaseDescriptor[] = [
  {
    key: "diagnosis",
    position: 1,
    title: "Diagnóstico",
    objective: "Compreender o aluno antes de qualquer decisão.",
    problem: "Decidir sem conhecer a pessoa leva a planos genéricos que não aderem.",
    why: "Toda estratégia inteligente parte de objetivos, história, rotina, psicologia e riscos.",
    exitCriterion: "Entrevista estratégica concluída, com scores e hipóteses.",
    successIndicator: "Resumo executivo com riscos e oportunidades mapeados.",
  },
  {
    key: "preparation",
    position: 2,
    title: "Preparação",
    objective: "Organizar rotina, ambiente e a estratégia antes de começar.",
    problem: "Começar sem preparo transforma o plano em mais uma tentativa frustrada.",
    why: "Ambiente, compras, sono e estratégia definidos reduzem o atrito da implementação.",
    exitCriterion: "Estratégia e macros definidos, com o peso inicial registrado.",
    successIndicator: "Plano estratégico pronto e ambiente alimentar ajustado.",
  },
  {
    key: "implementation",
    position: 3,
    title: "Implementação",
    objective: "Iniciar a estratégia construindo aderência com pequenas vitórias.",
    problem: "Complexidade alta no início derruba a consistência.",
    why: "Aderência é o alicerce — primeiro o hábito, depois a precisão.",
    exitCriterion: "Primeiros acompanhamentos com boa adesão registrados.",
    successIndicator: "Rotina sustentada e aderência estável.",
  },
  {
    key: "consolidation",
    position: 4,
    title: "Consolidação",
    objective: "Ajustar e monitorar com mais precisão e individualização.",
    problem: "Sem monitoramento, desvios passam despercebidos e o progresso trava.",
    why: "Correções baseadas em dados mantêm o ritmo e evitam frustração.",
    exitCriterion: "Algumas semanas de acompanhamento com resposta consistente.",
    successIndicator: "Evolução no ritmo previsto e indicadores estáveis.",
  },
  {
    key: "optimization",
    position: 5,
    title: "Otimização",
    objective: "Refinar macros e estratégia; refeeds e diet breaks quando fizerem sentido.",
    problem: "Platôs e fadiga exigem mudanças graduais e justificadas.",
    why: "Investigar antes de mudar (aderência, sono, treino) evita cortes desnecessários.",
    exitCriterion: "Objetivo próximo de ser atingido, com boa resposta fisiológica.",
    successIndicator: "Composição corporal evoluindo com bem-estar preservado.",
  },
  {
    key: "transition",
    position: 6,
    title: "Transição",
    objective: "Preparar a manutenção com aumento gradual e mais autonomia.",
    problem: "Sair do plano de forma abrupta reativa o efeito sanfona.",
    why: "A transição gradual reduz a dependência do plano e educa o aluno.",
    exitCriterion: "Calorias reajustadas para manutenção e autonomia crescente.",
    successIndicator: "Peso estável com menor dependência do plano alimentar.",
  },
  {
    key: "maintenance",
    position: 7,
    title: "Manutenção",
    objective: "Sustentar o resultado e blindar contra recaídas.",
    problem: "Sem estratégia de manutenção, o resultado se perde com o tempo.",
    why: "Prevenir o efeito sanfona e planejar eventos protege a conquista.",
    exitCriterion: "Fase contínua — a conquista é mantida a longo prazo.",
    successIndicator: "Resultado preservado ao longo dos meses, com autonomia.",
  },
];

export const PHASE_BY_KEY: Record<PhaseKey, PhaseDescriptor> = Object.fromEntries(
  PHASE_DESCRIPTORS.map((p) => [p.key, p]),
) as Record<PhaseKey, PhaseDescriptor>;

export const TOTAL_PHASES = PHASE_DESCRIPTORS.length;

/** Limiares de avanço entre fases (baseados em sinais, não só em tempo). */
export const ADVANCE_THRESHOLDS = {
  /** Acompanhamentos mínimos para sair da Implementação. */
  consolidationFollowUps: 2,
  /** Semanas mínimas para sair da Implementação. */
  consolidationWeeks: 3,
  /** Semanas mínimas para entrar na Otimização. */
  optimizationWeeks: 8,
  /** Semanas para objetivo de manutenção atingir a fase Manutenção. */
  maintenanceWeeks: 6,
} as const;

/** Cadência da próxima revisão por "velocidade" (semanas). */
export const REVIEW_CADENCE_WEEKS = {
  fast: 2,
  normal: 3,
} as const;
