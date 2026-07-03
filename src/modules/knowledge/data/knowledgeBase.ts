/**
 * Base de Conhecimento curada. Cada entrada sustenta uma ou mais decisões do
 * sistema (velocidade, saciedade, ajustes...). As fontes são referências
 * consolidadas da literatura — o objetivo é rastreabilidade, não citação
 * acadêmica formal.
 */

import type { KnowledgeEntry } from "@/modules/knowledge/types";

export const knowledgeBase: KnowledgeEntry[] = [
  {
    id: "safe-deficit-pace",
    category: "estrategia",
    title: "Ritmo seguro de emagrecimento",
    principle:
      "Perdas de ~0,5–1% do peso corporal por semana equilibram velocidade e preservação de massa magra. Acima disso, cresce a perda de músculo e o risco de abandono.",
    application:
      "A velocidade e a projeção de meta limitam o déficit a essa faixa; ritmos mais agressivos são sinalizados como ambiciosos ou irrealistas.",
    sources: [
      { label: "Helms et al. — Recomendações para atletas naturais (JISSN)", kind: "review" },
      { label: "Diretrizes de manejo do peso baseadas em evidência", kind: "guideline" },
    ],
    tags: ["velocidade", "déficit", "massa magra"],
  },
  {
    id: "lean-mass-preservation",
    category: "treino",
    title: "Preservar massa magra no déficit",
    principle:
      "Treino de força e proteína adequada (~1,6–2,2 g/kg) reduzem a fração da perda que vem de músculo, especialmente em déficits maiores.",
    application:
      "A projeção de perda de massa magra alivia com treino de força regular e proteína adequada; a prescrição de proteína segue essa faixa por objetivo.",
    sources: [
      { label: "ISSN Position Stand — Proteína e exercício", kind: "consensus" },
      { label: "Murphy & Koehler — Déficit e massa magra (meta-análise)", kind: "meta_analysis" },
    ],
    tags: ["proteína", "massa magra", "treino de força"],
  },
  {
    id: "protein-satiety",
    category: "saciedade",
    title: "Proteína e saciedade",
    principle:
      "A proteína é o macronutriente mais saciante por caloria. Distribuí-la nas refeições ajuda a controlar a fome durante o déficit.",
    application:
      "Quando o controle de fome é baixo, a estratégia prioriza proteína alta em todas as refeições antes de qualquer restrição.",
    sources: [
      { label: "Leidy et al. — Papel da proteína no controle do apetite", kind: "review" },
    ],
    tags: ["proteína", "saciedade", "fome"],
  },
  {
    id: "food-volume-satiety",
    category: "saciedade",
    title: "Volume alimentar e densidade energética",
    principle:
      "Alimentos de baixa densidade energética (vegetais, frutas, fontes ricas em água e fibra) aumentam a saciedade com poucas calorias.",
    application:
      "O plano usa vegetais em porção fixa para dar volume; a análise do recordatório sinaliza quando faltam vegetais e fibras.",
    sources: [
      { label: "Rolls — Densidade energética e saciedade", kind: "review" },
    ],
    tags: ["fibra", "vegetais", "volume", "saciedade"],
  },
  {
    id: "flexible-dieting",
    category: "comportamento",
    title: "Dieta flexível vs. tudo-ou-nada",
    principle:
      "Restrição rígida associa-se a mais compulsão e abandono; abordagens flexíveis melhoram a aderência e a relação com a comida.",
    application:
      "Perfis tudo-ou-nada recebem flexibilidade planejada e fins de semana com estrutura, evitando o ciclo culpa-restrição.",
    sources: [
      { label: "Stewart et al. — Restrição rígida vs. flexível", kind: "review" },
    ],
    tags: ["flexibilidade", "tudo-ou-nada", "aderência"],
  },
  {
    id: "binge-behavior-first",
    category: "comportamento",
    title: "Compulsão: comportamento antes de restrição",
    principle:
      "Episódios de compulsão pioram com restrição agressiva. Tratar gatilhos e ambiente costuma render mais que cortar calorias.",
    application:
      "Com compulsão frequente, a estratégia prioriza organização do ambiente e gatilhos antes de reduzir calorias.",
    sources: [
      { label: "Diretrizes de manejo do transtorno de compulsão alimentar", kind: "guideline" },
    ],
    tags: ["compulsão", "gatilhos", "comportamento"],
  },
  {
    id: "food-environment",
    category: "comportamento",
    title: "Ambiente alimentar",
    principle:
      "A disponibilidade de alimentos em casa influencia fortemente o que se come. Ajustar o ambiente costuma superar a força de vontade.",
    application:
      "Quando há muita tentação em casa ou pouco apoio, o foco é ajustar o ambiente antes de restringir.",
    sources: [
      { label: "Hollands et al. — Intervenções de ambiente alimentar (Cochrane)", kind: "meta_analysis" },
    ],
    tags: ["ambiente", "casa", "aderência"],
  },
  {
    id: "meal-frequency-adherence",
    category: "estrategia",
    title: "Frequência de refeições e aderência",
    principle:
      "Dentro do mesmo total calórico e proteico, a frequência de refeições tem pouco efeito na composição corporal — a melhor frequência é a que o aluno sustenta.",
    application:
      "O número de refeições é escolhido pela aderência (rotina, fome), não por um 'ideal metabólico'.",
    sources: [
      { label: "Schoenfeld et al. — Frequência alimentar (meta-análise)", kind: "meta_analysis" },
    ],
    tags: ["refeições", "frequência", "aderência"],
  },
  {
    id: "refeed-diet-break",
    category: "ajustes",
    title: "Diet break e refeed",
    principle:
      "Pausas planejadas na dieta ou refeeds podem melhorar a aderência e atenuar adaptações do déficit prolongado, sem prejudicar o resultado.",
    application:
      "No plano de ajustes, considera-se diet break/refeed quando a aderência, a fome ou a energia pioram no déficit.",
    sources: [
      { label: "Byrne et al. — Intervenções intermitentes (MATADOR)", kind: "rct" },
    ],
    tags: ["refeed", "diet break", "ajustes"],
  },
  {
    id: "adjust-after-plateau",
    category: "ajustes",
    title: "Ajustar só após estagnação real",
    principle:
      "Flutuações de peso de curto prazo (água, glicogênio, intestino) mascaram a tendência. Ajustes devem seguir a média ao longo de 2+ semanas.",
    application:
      "O sistema recomenda reduzir calorias ou aumentar o gasto apenas após estagnação sustentada, não por uma pesagem isolada.",
    sources: [
      { label: "Boas práticas de monitoramento de peso e tendência", kind: "review" },
    ],
    tags: ["estagnação", "ajustes", "tendência"],
  },
  {
    id: "supplements-food-first",
    category: "suplementacao",
    title: "Comida primeiro, suplemento depois",
    principle:
      "Suplementos resolvem dificuldades específicas (praticidade, saciedade), não substituem a base alimentar. Só entram quando agregam de fato.",
    application:
      "A suplementação é decidida a partir da dificuldade a resolver e do orçamento — nunca por obrigação.",
    sources: [
      { label: "ISSN — Posições sobre suplementos", kind: "consensus" },
    ],
    tags: ["suplementos", "whey", "praticidade"],
  },
  {
    id: "liquid-calories",
    category: "comportamento",
    title: "Calorias líquidas",
    principle:
      "Bebidas calóricas (refrigerante, sucos adoçados, álcool) saciam pouco e passam despercebidas, contribuindo para o excedente calórico.",
    application:
      "A análise do recordatório e as hipóteses sinalizam calorias líquidas e sugerem trocas de baixa perda percebida.",
    sources: [
      { label: "Pan & Hu — Bebidas calóricas e balanço energético (revisão)", kind: "review" },
    ],
    tags: ["bebidas", "açúcar", "álcool"],
  },
  {
    id: "hydration-appetite",
    category: "hidratacao",
    title: "Hidratação e apetite",
    principle:
      "A desidratação leve pode ser confundida com fome. Uma ingestão adequada de água apoia o controle do apetite e o desempenho.",
    application:
      "Baixa ingestão de água é apontada como uma vitória rápida e de baixo custo no controle da fome.",
    sources: [
      { label: "Revisões sobre hidratação e regulação do apetite", kind: "review" },
    ],
    tags: ["água", "hidratação", "apetite"],
  },
  {
    id: "sleep-adherence",
    category: "sono",
    title: "Sono, fome e aderência",
    principle:
      "A privação de sono desregula os hormônios do apetite (leptina/grelina), aumenta a fome e reduz a aderência e a preservação de massa magra.",
    application:
      "Sono baixo penaliza os indicadores de consistência e é tratado como alavanca antes de intensificar o déficit.",
    sources: [
      { label: "Nedeltcheva et al. — Sono e composição corporal (RCT)", kind: "rct" },
    ],
    tags: ["sono", "fome", "aderência"],
  },
];
