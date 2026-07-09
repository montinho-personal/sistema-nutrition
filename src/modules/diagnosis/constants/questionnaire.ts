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
    id: "alimentacao",
    title: "Seu dia alimentar",
    description: "Como é a sua comida num dia comum — sem julgamento, é para conhecer o seu ponto de partida.",
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
  // Antropometria essencial: peso, altura e idade abrem a etapa. Complementam o
  // cadastro (que passa a ser opcional nesses campos) — o cálculo dos macros usa
  // o cadastro quando existir e cai nestas respostas quando não existir.
  {
    key: "current_weight_kg",
    block: "corporal",
    type: "number",
    label: "Qual é o seu peso atual?",
    help: "O peso de hoje (ou o mais recente que você souber). É a base de todos os cálculos do plano.",
    unit: "kg",
    placeholder: "Ex.: 82",
  },
  {
    key: "height_cm",
    block: "corporal",
    type: "number",
    label: "Qual é a sua altura?",
    help: "Em centímetros. Junto com o peso, define o seu gasto calórico de repouso.",
    unit: "cm",
    placeholder: "Ex.: 172",
  },
  {
    key: "age_years",
    block: "corporal",
    type: "number",
    label: "Quantos anos você tem?",
    help: "A idade entra na fórmula do metabolismo — cada década muda o cálculo.",
    unit: "anos",
    placeholder: "Ex.: 34",
  },
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
    key: "regain_trigger",
    block: "corporal",
    type: "single",
    label: "O que costumava fazer o peso voltar?",
    help: "Entender o que aconteceu antes ajuda a evitar que se repita.",
    showIf: (a) => a.weight_history === "sanfona",
    options: [
      { value: "parou_treino", label: "Parei de treinar" },
      { value: "voltou_habitos", label: "Voltei aos antigos hábitos" },
      { value: "emocional", label: "Uma fase emocional difícil" },
      { value: "restricao", label: "A dieta era restritiva demais", scores: { flexibility: -5 } },
      { value: "nao_sei", label: "Não sei dizer" },
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
  {
    key: "diet_blocker",
    block: "corporal",
    type: "single",
    label: "Nas tentativas anteriores, o que mais atrapalhou?",
    help: "O maior obstáculo do passado costuma ser o ponto a resolver primeiro.",
    showIf: (a) => a.diet_experience === "muitas_sem",
    options: [
      { value: "fome", label: "Sentia muita fome", scores: { hungerControl: -5 } },
      { value: "tempo", label: "Falta de tempo para preparar", scores: { practicality: -5 } },
      { value: "social", label: "A vida social (sair, eventos)" },
      { value: "ansiedade", label: "Ansiedade / comer emocional", scores: { abandonmentRisk: 5 } },
      { value: "rigidez", label: "O plano era rígido demais", scores: { flexibility: -5 } },
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
    help: "Restaurante, lanchonete, marmita de fora, iFood — tudo conta. Comer fora com frequência costuma esconder calorias e dificultar o controle.",
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
  {
    key: "meals_out_food",
    block: "rotina",
    type: "text",
    label: "Quando come fora ou pede delivery, o que você costuma pedir?",
    help: "Os pratos e lanches mais frequentes. Saber o que você já pede ajuda a manter o que dá certo e ajustar o que atrapalha — sem cortar o que você gosta.",
    placeholder: "Ex.: hambúrguer, pizza, marmita de frango, açaí, japonês...",
    optional: true,
    showIf: (a) => a.meals_out === "semanal" || a.meals_out === "quase_diario",
  },

  // ── Saúde ───────────────────────────────────────────────────────────────────
  {
    key: "health_conditions",
    block: "saude",
    type: "multi",
    label: "Você tem alguma condição de saúde?",
    help: 'Marque todas que se aplicam. Se não tiver nenhuma, marque "Nenhuma". Condições de saúde mudam escolhas do plano (sal, açúcar, fibras, horários).',
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
    key: "health_other",
    block: "saude",
    type: "text",
    label: "Conte um pouco sobre essa condição de saúde.",
    help: "Assim conseguimos respeitar as suas necessidades no plano.",
    placeholder: "Ex.: colesterol alto, enxaqueca...",
    showIf: (a) => Array.isArray(a.health_conditions) && a.health_conditions.includes("outra"),
  },
  {
    key: "diabetes_med",
    block: "saude",
    type: "single",
    label: "Você usa alguma medicação para o diabetes?",
    help: "Só para termos cuidado: o plano é sempre alinhado à orientação do seu médico.",
    showIf: (a) => Array.isArray(a.health_conditions) && a.health_conditions.includes("diabetes"),
    options: [
      { value: "insulina", label: "Sim, insulina" },
      { value: "oral", label: "Sim, comprimido" },
      { value: "nao", label: "Não uso" },
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
  {
    key: "bowel_frequency",
    block: "saude",
    type: "single",
    label: "Com que frequência você evacua?",
    help: "O ritmo do intestino é um bom termômetro de fibras, água e saúde digestiva. Não existe número perfeito, mas os extremos merecem atenção.",
    options: [
      { value: "varias_dia", label: "Várias vezes ao dia" },
      { value: "uma_dia", label: "Uma vez por dia" },
      { value: "dias_alternados", label: "A cada 2–3 dias", scores: { hungerControl: -2 } },
      { value: "raro", label: "Menos que isso", scores: { hungerControl: -4 } },
    ],
  },
  {
    key: "stool_quality",
    block: "saude",
    type: "single",
    label: "Como costumam ser as fezes?",
    help: "Ajuda a entender fibras, hidratação e intestino: ressecadas indicam pouca fibra/água; muito amolecidas ou líquidas indicam intolerância ou trânsito acelerado.",
    options: [
      { value: "ressecadas", label: "Ressecadas / duras (difícil sair)" },
      { value: "normais", label: "Normais (bem formadas)" },
      { value: "amolecidas", label: "Amolecidas / pastosas" },
      { value: "liquidas", label: "Líquidas / diarreia frequente" },
    ],
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
    key: "night_food",
    block: "comportamento",
    type: "text",
    label: "O que você costuma comer ou beliscar à noite?",
    help: "Saber o que é ajuda a trocar por algo que sacia sem sabotar o plano.",
    placeholder: "Ex.: bolacha, pão, doce, salgadinho...",
    optional: true,
    showIf: (a) => a.night_eating === "frequente",
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
    key: "compulsion_trigger",
    block: "comportamento",
    type: "multi",
    label: "O que costuma disparar esses episódios?",
    help: "Marque o que mais acontece com você. Conhecer o gatilho é metade da solução.",
    showIf: (a) => a.compulsion === "frequente" || a.compulsion === "as_vezes",
    options: [
      { value: "estresse", label: "Estresse / ansiedade" },
      { value: "tedio", label: "Tédio" },
      { value: "noite", label: "À noite, ao relaxar" },
      { value: "emocoes", label: "Brigas ou emoções fortes" },
      { value: "restricao", label: "Depois de passar fome / me privar" },
      { value: "social", label: "Em situações sociais" },
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
  {
    key: "sweets_timing",
    block: "comportamento",
    type: "single",
    label: "Em que momento a vontade de doce mais aperta?",
    help: "Saber a hora ajuda a planejar uma opção que satisfaça sem descarrilar o dia.",
    showIf: (a) => a.sweets === "gatilho",
    options: [
      { value: "apos_refeicoes", label: "Depois das refeições" },
      { value: "tarde", label: "À tarde" },
      { value: "noite", label: "À noite" },
      { value: "dia_todo", label: "O dia todo", scores: { hungerControl: -5 } },
    ],
  },

  // ── Seu dia alimentar (recordatório) ────────────────────────────────────────
  {
    key: "follows_diet",
    block: "alimentacao",
    type: "single",
    label: "Você já segue alguma dieta ou plano alimentar hoje?",
    help: "Se você já tem um plano, vamos partir dele. Se não, vamos descobrir juntos como é a sua alimentação num dia comum — sem julgamento.",
    options: [
      { value: "sim", label: "Sim, sigo um plano certinho", scores: { organization: 8, adherence: 5 } },
      { value: "mais_ou_menos", label: "Mais ou menos / às vezes" },
      { value: "nao", label: "Não sigo nada específico" },
    ],
  },
  {
    key: "current_diet_detail",
    block: "alimentacao",
    type: "text",
    label: "Descreva a dieta que você já segue, com as refeições e as quantidades.",
    help: "Coloque tudo o que conseguir lembrar, o mais certinho possível: horário, alimentos e quantidades (gramas, colheres, unidades). Quanto mais detalhado, mais precisa fica a estratégia.",
    placeholder:
      "Ex.: 7h — 3 ovos + 2 fatias de pão integral; 12h — 150 g de arroz, 120 g de frango, salada; 16h — 1 scoop de whey + 1 banana...",
    optional: true,
    showIf: (a) => a.follows_diet === "sim",
  },
  {
    key: "meals_per_day",
    block: "alimentacao",
    type: "single",
    label: "Quantas refeições você costuma fazer por dia?",
    help: "Conte só as refeições de verdade, sem os beliscos.",
    options: [
      { value: "1_2", label: "1 a 2" },
      { value: "3", label: "3" },
      { value: "4_5", label: "4 a 5", scores: { organization: 5 } },
      {
        value: "beliscando",
        label: "Belisco o dia todo, sem hora certa",
        scores: { hungerControl: -8, organization: -8 },
      },
    ],
  },
  {
    key: "breakfast",
    block: "alimentacao",
    type: "text",
    label: "O que você costuma comer no café da manhã?",
    help: 'De um dia comum, com as quantidades que lembrar. Se costuma pular, escreva "pulo o café".',
    placeholder: "Ex.: café com 2 pães e 2 ovos; ou pulo o café...",
    optional: true,
    showIf: (a) => a.follows_diet !== "sim",
  },
  {
    key: "lunch",
    block: "alimentacao",
    type: "text",
    label: "E no almoço, o que costuma comer?",
    help: "Como é o seu prato num dia normal — quanto de arroz, proteína, salada, etc.",
    placeholder: "Ex.: 1 prato de arroz e feijão, 1 filé de frango e salada...",
    optional: true,
    showIf: (a) => a.follows_diet !== "sim",
  },
  {
    key: "dinner",
    block: "alimentacao",
    type: "text",
    label: "E no jantar?",
    help: "Se janta a mesma coisa do almoço, pode escrever isso.",
    placeholder: "Ex.: repito o almoço; ou um lanche...",
    optional: true,
    showIf: (a) => a.follows_diet !== "sim",
  },
  {
    key: "snacks",
    block: "alimentacao",
    type: "text",
    label: "O que você costuma beliscar entre as refeições?",
    help: "Aqueles lanchinhos e beliscos ao longo do dia — café, fruta, biscoito, castanhas, um docinho. Muitas vezes é aqui que moram calorias que passam despercebidas.",
    placeholder: "Ex.: café com açúcar, fruta, castanhas, biscoito, chocolate...",
    optional: true,
  },
  {
    key: "water_intake",
    block: "alimentacao",
    type: "single",
    label: "Quanta água você bebe por dia, mais ou menos?",
    help: "Um copo tem cerca de 250 ml; uma garrafinha, cerca de 500 ml.",
    options: [
      { value: "menos_1l", label: "Menos de 1 litro", scores: { hungerControl: -4 } },
      { value: "1_2l", label: "Entre 1 e 2 litros" },
      { value: "mais_2l", label: "Mais de 2 litros" },
    ],
  },
  {
    key: "beverages",
    block: "alimentacao",
    type: "multi",
    label: "O que você costuma beber ao longo do dia?",
    help: "Marque todas. Ajuda a encontrar calorias líquidas que passam despercebidas.",
    options: [
      { value: "agua_cha", label: "Água / chá sem açúcar" },
      { value: "cafe", label: "Café" },
      { value: "refrigerante", label: "Refrigerante / suco adoçado", scores: { environment: -6 } },
      { value: "suco_natural", label: "Suco natural" },
      { value: "energetico", label: "Energético", scores: { hungerControl: -3 } },
      { value: "alcool", label: "Bebida alcoólica" },
    ],
  },
  {
    key: "alcohol_frequency",
    block: "alimentacao",
    type: "single",
    label: "Com que frequência você bebe álcool?",
    help: "Sem julgamento — só entra na conta das calorias da semana.",
    showIf: (a) => Array.isArray(a.beverages) && a.beverages.includes("alcool"),
    options: [
      { value: "raramente", label: "Raramente" },
      { value: "fim_de_semana", label: "Nos fins de semana" },
      { value: "quase_diario", label: "Quase todo dia", scores: { environment: -8 } },
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
    help: "Marque todos que você pratica. O tipo de treino muda o gasto calórico e a necessidade de carboidrato e proteína.",
    showIf: (a) => a.trains === "regular" || a.trains === "irregular",
    options: [
      { value: "musculacao", label: "Musculação" },
      { value: "cardio", label: "Cardio" },
      { value: "esporte", label: "Esporte" },
      { value: "caminhada", label: "Caminhada" },
    ],
  },
  {
    key: "training_days_per_week",
    block: "treino",
    type: "number",
    label: "Quantos dias por semana você treina?",
    help: "Uma média das semanas. A frequência é peça-chave para estimar o seu gasto calórico da semana.",
    unit: "dias/sem",
    placeholder: "Ex.: 4",
    showIf: (a) => a.trains === "regular" || a.trains === "irregular",
  },
  {
    key: "training_duration",
    block: "treino",
    type: "number",
    label: "Quanto tempo dura cada treino, em média?",
    help: "Do aquecimento ao fim. Junto com a frequência, o tempo de treino ajuda a calcular melhor as calorias gastas.",
    unit: "min",
    placeholder: "Ex.: 60",
    showIf: (a) => a.trains === "regular" || a.trains === "irregular",
  },
  {
    key: "training_split_detail",
    block: "treino",
    type: "text",
    label: "Se você faz mais de um tipo de treino, quanto tempo dedica a cada?",
    help: "Ex.: musculação e corrida no mesmo dia, ou dias separados. Ajuda a estimar o gasto de cada modalidade.",
    placeholder: "Ex.: 45 min de musculação + 20 min de esteira; corrida 40 min 2x/semana...",
    optional: true,
    showIf: (a) =>
      Array.isArray(a.training_type) && a.training_type.length >= 2,
  },
  {
    key: "activity",
    block: "treino",
    type: "single",
    label: "Fora o treino, como é o seu dia a dia?",
    help: "Sedentário = quase sempre sentado(a); ativo = muito em pé ou andando. Isso conta muito no gasto de quem trabalha em pé ou anda bastante.",
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
    key: "restrictions_other",
    block: "preferencias",
    type: "text",
    label: "Qual é a sua restrição?",
    help: "Assim garantimos que nada no plano vá contra ela.",
    placeholder: "Ex.: alergia a frutos do mar, não como carne vermelha...",
    showIf: (a) => Array.isArray(a.restrictions) && a.restrictions.includes("outra"),
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
  {
    key: "disliked_foods",
    block: "preferencias",
    type: "text",
    label: "E o que você não gosta ou não come de jeito nenhum?",
    help: "O plano nunca vai insistir nesses — pode ser sincero(a).",
    placeholder: "Ex.: fígado, jiló, peixe...",
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
    help: "Só entram se resolverem algo de verdade — nunca por obrigação. Comida sempre vem primeiro.",
    options: [
      { value: "sim", label: "Sim" },
      { value: "depende", label: "Depende do custo" },
      { value: "nao", label: "Prefiro evitar" },
    ],
  },
  {
    key: "supplement_budget",
    block: "orcamento",
    type: "single",
    label: "Quanto você poderia investir em suplementos por mês?",
    help: "Ajuda a recomendar só o que cabe no seu bolso — do essencial (o que dá mais retorno) ao completo. Nenhum suplemento é obrigatório.",
    showIf: (a) => a.supplement_openness === "sim" || a.supplement_openness === "depende",
    options: [
      { value: "ate_50", label: "Até R$ 50" },
      { value: "50_150", label: "R$ 50 a R$ 150" },
      { value: "150_300", label: "R$ 150 a R$ 300" },
      { value: "acima_300", label: "Acima de R$ 300" },
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

/**
 * Todas as perguntas atualmente aplicáveis (as condicionais só contam quando
 * a condição está satisfeita). Base honesta para o grau de confiança: uma
 * pergunta que nem apareceu não deveria derrubar a confiança (Documento 03B).
 */
export function visibleQuestions(answers: Record<string, unknown>): Question[] {
  return QUESTIONS.filter((q) => !q.showIf || q.showIf(answers as never));
}
