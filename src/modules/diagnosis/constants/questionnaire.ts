/**
 * Questionário da Entrevista Estratégica (Documento 06 — as 10 etapas).
 *
 * Cada resposta pode carregar contribuições de score (`scores`), tornando o
 * diagnóstico determinístico e auditável (Documento 08 — regra, não IA).
 * Perguntas condicionais (`showIf`) adaptam a entrevista (Documento 03B).
 */

import type { Question, Stage } from "@/modules/diagnosis/types";

export const STAGES: Stage[] = [
  {
    id: "objetivo",
    title: "Objetivo",
    description: "O que traz o aluno e o quanto está motivado.",
  },
  {
    id: "corporal",
    title: "Histórico corporal",
    description: "Trajetória de peso e experiência com dietas.",
  },
  { id: "rotina", title: "Rotina", description: "Trabalho, cozinha, sono e alimentação fora." },
  { id: "saude", title: "Saúde", description: "Condições clínicas e digestão." },
  {
    id: "comportamento",
    title: "Comportamento alimentar",
    description: "Fome, compulsão e gatilhos.",
  },
  {
    id: "psicologico",
    title: "Perfil psicológico",
    description: "Disciplina, autoeficácia e planejamento.",
  },
  { id: "ambiente", title: "Ambiente alimentar", description: "Casa, quem cozinha e apoio." },
  { id: "treino", title: "Treinamento", description: "Atividade física atual." },
  { id: "preferencias", title: "Preferências", description: "Abertura alimentar e restrições." },
  { id: "orcamento", title: "Orçamento", description: "Realidade financeira e compras." },
];

const yesNo = (yes = "Sim", no = "Não") => [
  { value: "sim", label: yes },
  { value: "nao", label: no },
];

export const QUESTIONS: Question[] = [
  // ── Objetivo ───────────────────────────────────────────────────────────────
  {
    key: "motivation_level",
    block: "objetivo",
    type: "scale",
    label: "O quanto o aluno está motivado hoje?",
    scale: { min: 0, max: 10, minLabel: "Pouco", maxLabel: "Muito" },
    scores: { motivation: 40 },
  },
  {
    key: "timeline",
    block: "objetivo",
    type: "single",
    label: "Qual o prazo/urgência para o resultado?",
    options: [
      {
        value: "urgente",
        label: "Urgente (1–3 meses)",
        scores: { abandonmentRisk: 15, motivation: 5 },
      },
      { value: "moderado", label: "Moderado (3–6 meses)" },
      {
        value: "tranquilo",
        label: "Sem pressa (6+ meses)",
        scores: { adherence: 8, flexibility: 5 },
      },
    ],
  },
  {
    key: "has_event",
    block: "objetivo",
    type: "single",
    label: "Existe um evento ou data específica?",
    options: yesNo(),
  },

  // ── Histórico corporal ──────────────────────────────────────────────────────
  {
    key: "weight_history",
    block: "corporal",
    type: "single",
    label: "Como foi o histórico de peso?",
    options: [
      { value: "estavel", label: "Sempre estável", scores: { consistency: 10 } },
      { value: "tentativas", label: "Algumas oscilações" },
      {
        value: "sanfona",
        label: "Efeito sanfona",
        scores: { abandonmentRisk: 20, flexibility: -10 },
      },
    ],
  },
  {
    key: "diet_experience",
    block: "corporal",
    type: "single",
    label: "Qual a experiência com dietas?",
    options: [
      { value: "nunca", label: "Nunca fez dieta" },
      { value: "algumas", label: "Já fez algumas", scores: { adherence: 5 } },
      {
        value: "muitas_sem",
        label: "Muitas, sem sucesso",
        scores: { abandonmentRisk: 12, motivation: -5 },
      },
      {
        value: "muitas_com",
        label: "Já teve sucesso antes",
        scores: { adherence: 12, consistency: 8 },
      },
    ],
  },

  // ── Rotina ──────────────────────────────────────────────────────────────────
  {
    key: "work_location",
    block: "rotina",
    type: "single",
    label: "Onde o aluno trabalha na maior parte do tempo?",
    options: [
      { value: "home", label: "Em casa (home office)" },
      { value: "escritorio", label: "Escritório" },
      { value: "externo", label: "Externo / na rua", scores: { practicality: -10 } },
      { value: "nao_trabalha", label: "Não trabalha fora" },
    ],
  },
  {
    key: "home_snacking",
    block: "rotina",
    type: "single",
    label: "Trabalhando em casa, costuma beliscar durante o expediente?",
    showIf: (a) => a.work_location === "home",
    options: [
      {
        value: "frequente",
        label: "Com frequência",
        scores: { hungerControl: -10, environment: -5 },
      },
      { value: "as_vezes", label: "Às vezes" },
      { value: "nao", label: "Raramente" },
    ],
  },
  {
    key: "cook_availability",
    block: "rotina",
    type: "single",
    label: "Consegue cozinhar ou preparar as próprias refeições?",
    options: [
      {
        value: "facil",
        label: "Sim, com facilidade",
        scores: { practicality: 20, organization: 8 },
      },
      { value: "as_vezes", label: "Às vezes", scores: { practicality: 5 } },
      { value: "quase_nunca", label: "Quase nunca", scores: { practicality: -15 } },
    ],
  },
  {
    key: "sleep_hours",
    block: "rotina",
    type: "number",
    label: "Quantas horas dorme por noite, em média?",
    unit: "h",
    placeholder: "Ex.: 7",
  },
  {
    key: "meals_out",
    block: "rotina",
    type: "single",
    label: "Com que frequência come fora ou pede delivery?",
    options: [
      { value: "raramente", label: "Raramente", scores: { environment: 8 } },
      { value: "semanal", label: "Algumas vezes na semana" },
      {
        value: "quase_diario",
        label: "Quase todo dia",
        scores: { environment: -12, financial: -5 },
      },
    ],
  },

  // ── Saúde ───────────────────────────────────────────────────────────────────
  {
    key: "health_conditions",
    block: "saude",
    type: "multi",
    label: "Alguma condição de saúde relevante?",
    help: "Selecione todas que se aplicam.",
    options: [
      { value: "nenhuma", label: "Nenhuma" },
      { value: "diabetes", label: "Diabetes / resistência à insulina" },
      { value: "hipertensao", label: "Hipertensão" },
      { value: "refluxo", label: "Refluxo / gastrite" },
      { value: "intestino", label: "Intestino preso/irritável" },
      { value: "tireoide", label: "Tireoide" },
      { value: "outra", label: "Outra" },
    ],
  },
  {
    key: "digestion",
    block: "saude",
    type: "scale",
    label: "Como é a digestão no dia a dia?",
    scale: { min: 0, max: 10, minLabel: "Ruim", maxLabel: "Ótima" },
  },

  // ── Comportamento alimentar ─────────────────────────────────────────────────
  {
    key: "hunger_level",
    block: "comportamento",
    type: "scale",
    label: "Com que intensidade sente fome ao longo do dia?",
    scale: { min: 0, max: 10, minLabel: "Pouca", maxLabel: "Muita" },
    scores: { hungerControl: -35, abandonmentRisk: 10 },
  },
  {
    key: "night_eating",
    block: "comportamento",
    type: "single",
    label: "Come ou belisca demais à noite?",
    options: [
      {
        value: "frequente",
        label: "Com frequência",
        scores: { hungerControl: -15, abandonmentRisk: 8 },
      },
      { value: "as_vezes", label: "Às vezes" },
      { value: "nao", label: "Raramente" },
    ],
  },
  {
    key: "compulsion",
    block: "comportamento",
    type: "single",
    label: "Já teve episódios de compulsão alimentar?",
    options: [
      {
        value: "frequente",
        label: "Sim, com frequência",
        scores: { abandonmentRisk: 18, hungerControl: -10, flexibility: -8 },
      },
      { value: "as_vezes", label: "Sim, às vezes", scores: { abandonmentRisk: 8 } },
      { value: "nao", label: "Não" },
    ],
  },
  {
    key: "sweets",
    block: "comportamento",
    type: "single",
    label: "Como é a relação com doces?",
    options: [
      { value: "tranquila", label: "Tranquila" },
      { value: "gatilho", label: "Doce é um gatilho", scores: { hungerControl: -10 } },
    ],
  },

  // ── Perfil psicológico ──────────────────────────────────────────────────────
  {
    key: "all_or_nothing",
    block: "psicologico",
    type: "scale",
    label: 'O quanto o aluno é do tipo "tudo ou nada"?',
    help: "Ex.: se sai da dieta um dia, joga tudo pro alto.",
    scale: { min: 0, max: 10, minLabel: "Nada", maxLabel: "Muito" },
    scores: { flexibility: -40, abandonmentRisk: 20 },
  },
  {
    key: "discipline",
    block: "psicologico",
    type: "scale",
    label: "Como o aluno avalia a própria disciplina?",
    scale: { min: 0, max: 10, minLabel: "Baixa", maxLabel: "Alta" },
    scores: { consistency: 35, adherence: 15 },
  },
  {
    key: "self_efficacy",
    block: "psicologico",
    type: "scale",
    label: "O quanto acredita que vai conseguir dessa vez?",
    scale: { min: 0, max: 10, minLabel: "Pouco", maxLabel: "Muito" },
    scores: { motivation: 20, adherence: 10 },
  },
  {
    key: "planning",
    block: "psicologico",
    type: "single",
    label: "Costuma planejar as refeições da semana?",
    options: [
      { value: "sempre", label: "Quase sempre", scores: { organization: 20 } },
      { value: "as_vezes", label: "Às vezes" },
      { value: "nunca", label: "Quase nunca", scores: { organization: -15 } },
    ],
  },

  // ── Ambiente alimentar ──────────────────────────────────────────────────────
  {
    key: "who_cooks",
    block: "ambiente",
    type: "single",
    label: "Quem cozinha na casa?",
    options: [
      { value: "eu", label: "O próprio aluno" },
      { value: "familia", label: "Parceiro(a) / família" },
      {
        value: "ninguem",
        label: "Ninguém — come pronto",
        scores: { practicality: -8, environment: -8 },
      },
    ],
  },
  {
    key: "home_food",
    block: "ambiente",
    type: "single",
    label: "O que costuma ter disponível em casa?",
    options: [
      { value: "saudavel", label: "Comida saudável", scores: { environment: 15 } },
      { value: "misto", label: "Um pouco de tudo" },
      {
        value: "tentacao",
        label: "Muita tentação",
        scores: { environment: -15, hungerControl: -8 },
      },
    ],
  },
  {
    key: "family_support",
    block: "ambiente",
    type: "scale",
    label: "Qual o apoio da família / parceiro(a)?",
    scale: { min: 0, max: 10, minLabel: "Nenhum", maxLabel: "Total" },
    scores: { environment: 25, adherence: 8 },
  },

  // ── Treinamento ─────────────────────────────────────────────────────────────
  {
    key: "trains",
    block: "treino",
    type: "single",
    label: "O aluno treina atualmente?",
    options: [
      { value: "regular", label: "Sim, regularmente", scores: { consistency: 10, adherence: 8 } },
      { value: "irregular", label: "Sim, mas irregular" },
      { value: "nao", label: "Não treina" },
    ],
  },
  {
    key: "training_type",
    block: "treino",
    type: "multi",
    label: "Que tipos de treino?",
    showIf: (a) => a.trains === "regular" || a.trains === "irregular",
    options: [
      { value: "musculacao", label: "Musculação" },
      { value: "cardio", label: "Cardio" },
      { value: "esporte", label: "Esporte" },
      { value: "caminhada", label: "Caminhada" },
    ],
  },
  {
    key: "activity",
    block: "treino",
    type: "single",
    label: "Nível de atividade no dia a dia (fora o treino)?",
    options: [
      { value: "sedentario", label: "Sedentário" },
      { value: "moderado", label: "Moderado" },
      { value: "ativo", label: "Ativo", scores: { consistency: 5 } },
    ],
  },

  // ── Preferências ────────────────────────────────────────────────────────────
  {
    key: "food_openness",
    block: "preferencias",
    type: "scale",
    label: "O quanto é aberto a experimentar novos alimentos?",
    scale: { min: 0, max: 10, minLabel: "Fechado", maxLabel: "Aberto" },
    scores: { flexibility: 20 },
  },
  {
    key: "restrictions",
    block: "preferencias",
    type: "multi",
    label: "Restrições alimentares?",
    options: [
      { value: "nenhuma", label: "Nenhuma" },
      { value: "vegetariano", label: "Vegetariano" },
      { value: "vegano", label: "Vegano" },
      { value: "sem_lactose", label: "Sem lactose" },
      { value: "sem_gluten", label: "Sem glúten" },
      { value: "outra", label: "Outra" },
    ],
  },
  {
    key: "favorite_foods",
    block: "preferencias",
    type: "text",
    label: "Alimentos que o aluno ama e não abre mão?",
    placeholder: "Ex.: pão, café, chocolate...",
    optional: true,
  },

  // ── Orçamento ───────────────────────────────────────────────────────────────
  {
    key: "budget",
    block: "orcamento",
    type: "single",
    label: "Como está o orçamento para alimentação?",
    options: [
      { value: "apertado", label: "Apertado", scores: { financial: -25 } },
      { value: "medio", label: "Médio" },
      { value: "confortavel", label: "Confortável", scores: { financial: 25 } },
    ],
  },
  {
    key: "shopping_frequency",
    block: "orcamento",
    type: "single",
    label: "Com que frequência faz compras de comida?",
    options: [
      { value: "semanal", label: "Semanal", scores: { organization: 5 } },
      { value: "quinzenal", label: "Quinzenal" },
      { value: "quando_precisa", label: "Só quando precisa", scores: { organization: -8 } },
    ],
  },
  {
    key: "supplement_openness",
    block: "orcamento",
    type: "single",
    label: "Aberto a usar suplementos, se fizer sentido?",
    options: [
      { value: "sim", label: "Sim" },
      { value: "depende", label: "Depende do custo" },
      { value: "nao", label: "Prefere evitar" },
    ],
  },
];

/** Perguntas de um bloco, já filtradas por visibilidade condicional. */
export function visibleQuestionsForStage(
  stageId: string,
  answers: Record<string, unknown>,
): Question[] {
  return QUESTIONS.filter((q) => q.block === stageId && (!q.showIf || q.showIf(answers as never)));
}
