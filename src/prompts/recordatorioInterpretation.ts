/**
 * Prompt: interpretação do recordatório alimentar (camada de IA — V2).
 *
 * A leitura determinística vive em
 * `src/modules/diagnosis/services/recordatorioAnalysis.ts` e resolve a maior
 * parte dos casos (Documento 08 — regra antes de IA). Este prompt é o **seam**
 * para o enriquecimento por IA: só entra quando houver chave configurada, para
 * estimar composição e nuances que o texto livre esconde (ex.: quantidades,
 * preparos, padrões emocionais). Ainda não é chamado em runtime — documenta o
 * contrato para quando a IA for ativada.
 */

export const recordatorioInterpretationPrompt = {
  name: "recordatorio-interpretation",
  objective:
    "Interpretar o recordatório alimentar em texto livre e estimar composição por refeição + observações clínicas, complementando a análise determinística.",
  inputs: [
    "meals: { breakfast, lunch, dinner, snacks } (texto livre do aluno)",
    "context: { mealsPerDay, waterIntake, beverages, goal }",
    "deterministicObservations: string[] (o que a regra já identificou)",
  ],
  outputs: [
    "perMeal: [{ meal, estimatedKcal, estimatedProteinG, notes }]",
    "observations: [{ kind: 'risk'|'opportunity'|'recommendation', title, detail }]",
  ],
  version: 1,
  history: ["v1: contrato inicial (não invocado — aguardando ativação da IA)"],
  template: `Você é um nutricionista clínico analisando o "dia alimentar" relatado por um aluno.
NÃO invente alimentos que não foram citados. Quando faltar quantidade, estime de forma conservadora
e sinalize a incerteza. Nunca demonize alimentos; toda observação vem com orientação prática.

Refeições relatadas (texto livre do aluno):
- Café da manhã: {{breakfast}}
- Almoço: {{lunch}}
- Jantar: {{dinner}}
- Lanches: {{snacks}}

Contexto: objetivo={{goal}}, refeições/dia={{mealsPerDay}}, água={{waterIntake}}, bebidas={{beverages}}.
A análise determinística já apontou: {{deterministicObservations}}.

Responda SOMENTE em JSON válido no formato:
{
  "perMeal": [{ "meal": "breakfast|lunch|dinner|snacks", "estimatedKcal": number, "estimatedProteinG": number, "notes": string }],
  "observations": [{ "kind": "risk|opportunity|recommendation", "title": string, "detail": string }]
}
Não repita observações que a análise determinística já cobriu; traga só o que ela não capturou.`,
} as const;
