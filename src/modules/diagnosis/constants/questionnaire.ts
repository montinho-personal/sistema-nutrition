/**
 * Questionário da Entrevista Estratégica (Documento 06 — as 10 etapas).
 *
 * Cada resposta pode carregar contribuições de score (`scores`), tornando o
 * diagnóstico determinístico e auditável (Documento 08 — regra, não IA).
 * Perguntas condicionais (`showIf`) adaptam a entrevista (Documento 03B).
 *
 * As perguntas falam direto com quem responde ("você") e trazem uma explicação
 * simples abaixo (`help`) — a anamnese pode ser preenchida pelo próprio aluno
 * (Documento 07 — nunca parecer um formulário frio).
 */

import type { Question, Stage } from "@/modules/diagnosis/types";

export const STAGES: Stage[] = [
  {
    id: "objetivo",
    title: "Objetivo",
    description: "Por que você está aqui e o quanto está animado(a) para começar.",
  },
  {
    id: "corporal",
    title: "Histórico corporal",
    description: "Sua história com o peso e com dietas.",
  },
  {
    id: "rotina",
    title: "Rotina",
    description: "Seu trabalho, sua cozinha, seu sono e as refeições fora de casa.",
  },
  { id: "saude", title: "Saúde", description: "Condições de saúde e como anda a digestão." },
  {
    id: "comportamento",
    title: "Comportamento alimentar",
    description: "Fome, vontade de comer e gatilhos do dia a dia.",
  },
  {
    id: "psicologico",
    title: "Perfil psicológico",
    description: "Como você lida com disciplina, confiança e planejamento.",
  },
  {
    id: "ambiente",
    title: "Ambiente alimentar",
    description: "Como é a comida e o apoio na sua casa.",
  },
  { id: "treino", title: "Treinamento", description: "Sua atividade física hoje." },
  {
    id: "preferencias",
    title: "Preferências",
    description: "O que você gosta, o que evita e suas restrições.",
  },
  {
    id: "orcamento",
    title: "Orçamento",
    description: "Sua realidade financeira e como você faz as compras.",
  },
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
    label: "O quanto você está animado(a) para começar essa mudança?",
    help: "Arraste para a direita se está muito empolgado(a); para a esquerda se ainda está na dúvida.",
    scale: { min: 0, max: 10, minLabel: "Pouco", maxLabel: "Muito" },
    scores: { motivation: 40 },
  },
  {
    key: "timeline",
    block: "objetivo",
    type: "single",
    label: "Em quanto tempo você quer ver resultado?",
    help: "Não existe certo ou errado — é só para entendermos o seu ritmo ideal.",
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
    label: "Tem alguma data ou evento marcado?",
    help: "Casamento, viagem, competição... ajuda a planejar o calendário até lá.",
    options: yesNo(),
  },

  // ── Histórico corporal ──────────────────────────────────────────────────────
  {
    key: "weight_history",
    block: "corporal",
    type: "single",
    label: "Como foi o seu peso ao longo da vida?",
    help: "Pense no histórico geral, sem precisar de números exatos.",
    options: [
      { value: "estavel", label: "Sempre estável", scores: { consistency: 10 } },
      { value: "tentativas", label: "Algumas oscilações" },
      {
        value: "sanfona",
        label: "Efeito sanfona (sobe e desce muito)",
        scores: { abandonmentRisk: 20, flexibility: -10 },
      },
    ],
  },
  {
    key: "diet_experience",
    block: "corporal",
    type: "single",
    label: "Qual a sua experiência com dietas?",
    help: "Vale tudo: as que deram certo e as que não deram.",
    options: [
      { value: "nunca", label: "Nunca fiz dieta" },
      { value: "algumas", label: "Já fiz algumas", scores: { adherence: 5 } },
      {
        value: "muitas_sem",
        label: "Muitas, sem sucesso",
        scores: { abandonmentRisk: 12, motivation: -5 },
      },
      {
        value: "muitas_com",
        label: "Já tive sucesso antes",
        scores: { adherence: 12, consistency: 8 },
      },
    ],
  },

  // ── Rotina ──────────────────────────────────────────────────────────────────
  {
    key: "work_location",
    block: "rotina",
    type: "single",
    label: "Onde você passa a maior parte do dia trabalhando?",
    help: "Onde você fica muda muito as refeições e os beliscos do dia.",
    options: [
      { value: "home", label: "Em casa (home office)" },
      { value: "escritorio", label: "Escritório" },
      { value: "externo", label: "Na rua / externo", scores: { practicality: -10 } },
      { value: "nao_trabalha", label: "Não trabalho fora" },
    ],
  },
  {
    key: "home_snacking",
    block: "rotina",
    type: "single",
    label: "Trabalhando em casa, você belisca durante o expediente?",
    help: "Aquelas idas à cozinha entre uma tarefa e outra contam.",
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
    label: "Você consegue cozinhar ou preparar suas refeições?",
    help: "Pense no seu dia comum, não no dia ideal.",
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
    label: "Quantas horas você dorme por noite, em média?",
    help: "Uma média das noites da semana já basta.",
    unit: "h",
    placeholder: "Ex.: 7",
  },
  {
    key: "meals_out",
    block: "rotina",
    type: "single",
    label: "Com que frequência você come fora ou pede delivery?",
    help: "Restaurante, lanchonete, marmita de fora, delivery — tudo conta.",
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
    label: "Você tem alguma condição de saúde?",
    help: 'Marque todas que se aplicam. Se não tiver nenhuma, marque "Nenhuma".',
    options: [
      { value: "nenhuma", label: "Nenhuma" },
      { value: "diabetes", label: "Diabetes / resistência à insulina" },
      { value: "hipertensao", label: "Hipertensão (pressão alta)" },
      { value: "refluxo", label: "Refluxo / gastrite" },
      { value: "intestino", label: "Intestino preso ou irritado" },
      { value: "tireoide", label: "Tireoide" },
      { value: "outra", label: "Outra" },
    ],
  },
  {
    key: "digestion",
    block: "saude",
    type: "scale",
    label: "Como anda a sua digestão no dia a dia?",
    help: 'Inchaço, azia e intestino preso puxam para "Ruim"; tudo tranquilo puxa para "Ótima".',
    scale: { min: 0, max: 10, minLabel: "Ruim", maxLabel: "Ótima" },
  },

  // ── Comportamento alimentar ─────────────────────────────────────────────────
  {
    key: "hunger_level",
    block: "comportamento",
    type: "scale",
    label: "Quanta fome você costuma sentir ao longo do dia?",
    help: "Pense num dia normal: pouca fome à esquerda, muita fome à direita.",
    scale: { min: 0, max: 10, minLabel: "Pouca", maxLabel: "Muita" },
    scores: { hungerControl: -35, abandonmentRisk: 10 },
  },
  {
    key: "night_eating",
    block: "comportamento",
    type: "single",
    label: "Você come ou belisca demais à noite?",
    help: "Aquela fome ou vontade depois do jantar, já perto de dormir.",
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
    label: "Você já teve episódios de comer sem conseguir parar?",
    help: "Aquela sensação de perder o controle com a comida. Pode ser sincero(a) — fica entre nós.",
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
    label: "Como é a sua relação com doces?",
    help: '"Gatilho" é quando você começa e tem dificuldade de parar.',
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
    label: 'O quanto você é do tipo "tudo ou nada"?',
    help: 'Se saiu da dieta um dia e já sente que "perdeu tudo", você tende ao "tudo ou nada".',
    scale: { min: 0, max: 10, minLabel: "Nada", maxLabel: "Muito" },
    scores: { flexibility: -40, abandonmentRisk: 20 },
  },
  {
    key: "discipline",
    block: "psicologico",
    type: "scale",
    label: "Como você avalia a sua disciplina?",
    help: "Seja honesto(a) — isso ajuda a montar um plano do seu tamanho.",
    scale: { min: 0, max: 10, minLabel: "Baixa", maxLabel: "Alta" },
    scores: { consistency: 35, adherence: 15 },
  },
  {
    key: "self_efficacy",
    block: "psicologico",
    type: "scale",
    label: "O quanto você acredita que vai conseguir dessa vez?",
    help: "Sua confiança de que, desta vez, vai dar certo.",
    scale: { min: 0, max: 10, minLabel: "Pouco", maxLabel: "Muito" },
    scores: { motivation: 20, adherence: 10 },
  },
  {
    key: "planning",
    block: "psicologico",
    type: "single",
    label: "Você costuma planejar as refeições da semana?",
    help: "Deixar comida pronta, pensar no cardápio, fazer marmita...",
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
    label: "Quem cozinha na sua casa?",
    help: "Quem prepara a maior parte das refeições do dia a dia.",
    options: [
      { value: "eu", label: "Eu mesmo(a)" },
      { value: "familia", label: "Parceiro(a) / família" },
      {
        value: "ninguem",
        label: "Ninguém — como pronto",
        scores: { practicality: -8, environment: -8 },
      },
    ],
  },
  {
    key: "home_food",
    block: "ambiente",
    type: "single",
    label: "O que costuma ter para comer na sua casa?",
    help: "O que fica à mão na geladeira e nos armários.",
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
    label: "Quanto apoio você tem da família ou do(a) parceiro(a)?",
    help: "Pessoas por perto que ajudam (ou atrapalham) na sua alimentação.",
    scale: { min: 0, max: 10, minLabel: "Nenhum", maxLabel: "Total" },
    scores: { environment: 25, adherence: 8 },
  },

  // ── Treinamento ─────────────────────────────────────────────────────────────
  {
    key: "trains",
    block: "treino",
    type: "single",
    label: "Você treina atualmente?",
    help: "Academia, esporte, caminhada — qualquer atividade física conta.",
    options: [
      { value: "regular", label: "Sim, regularmente", scores: { consistency: 10, adherence: 8 } },
      { value: "irregular", label: "Sim, mas irregular" },
      { value: "nao", label: "Não treino" },
    ],
  },
  {
    key: "training_type",
    block: "treino",
    type: "multi",
    label: "Que tipos de treino você faz?",
    help: "Marque todos que você pratica.",
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
    label: "Fora o treino, como é o seu dia a dia?",
    help: "Sedentário = quase sempre sentado(a); ativo = muito em pé ou andando.",
    options: [
      { value: "sedentario", label: "Sedentário (parado a maior parte do tempo)" },
      { value: "moderado", label: "Moderado" },
      { value: "ativo", label: "Ativo (bastante em pé/andando)", scores: { consistency: 5 } },
    ],
  },

  // ── Preferências ────────────────────────────────────────────────────────────
  {
    key: "food_openness",
    block: "preferencias",
    type: "scale",
    label: "O quanto você é aberto(a) a experimentar alimentos novos?",
    help: '"Fechado" = gosta do de sempre; "Aberto" = topa variar bastante.',
    scale: { min: 0, max: 10, minLabel: "Fechado", maxLabel: "Aberto" },
    scores: { flexibility: 20 },
  },
  {
    key: "restrictions",
    block: "preferencias",
    type: "multi",
    label: "Você tem alguma restrição alimentar?",
    help: 'Marque todas que se aplicam. Sem restrição? Marque "Nenhuma".',
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
    label: "Quais alimentos você ama e não abre mão?",
    help: "A gente encaixa o que você gosta no plano — pode listar à vontade.",
    placeholder: "Ex.: pão, café, chocolate...",
    optional: true,
  },

  // ── Orçamento ───────────────────────────────────────────────────────────────
  {
    key: "budget",
    block: "orcamento",
    type: "single",
    label: "Como está o seu orçamento para alimentação?",
    help: "Sem julgamento — é para montar um plano que cabe no seu bolso.",
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
    label: "Com que frequência você faz compras de comida?",
    help: "Mercado, feira, hortifruti — a sua rotina de compras.",
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
    label: "Você toparia usar suplementos, se fizer sentido?",
    help: "Só entram se resolverem algo de verdade — nunca por obrigação.",
    options: [
      { value: "sim", label: "Sim" },
      { value: "depende", label: "Depende do custo" },
      { value: "nao", label: "Prefiro evitar" },
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
