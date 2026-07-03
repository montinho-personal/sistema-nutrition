/**
 * Prompt: interpretação da instrução do treinador em linguagem natural
 * (Personal Nutrition AI — Fatia A.2).
 *
 * A interpretação determinística vive em
 * `src/modules/meal-plan/services/mealPlanDirective.ts` e resolve os casos
 * comuns (Documento 08 — regra antes de IA). Este prompt alimenta o
 * enriquecimento por IA (`aiMealInstruction.ts` + a server action), acionado só
 * quando há chave configurada e sobra intenção não reconhecida. A IA devolve a
 * MESMA estrutura de restrições — e é obrigada a declarar o que NÃO sabe honrar,
 * em vez de inventar (honestidade — Documento 02).
 */

export const mealInstructionPrompt = {
  name: "meal-instruction-interpretation",
  objective:
    "Traduzir a instrução do treinador em restrições estruturadas suportadas pelo motor de cardápio, declarando o que não pode ser honrado.",
  inputs: [
    "instruction: string (texto livre do treinador)",
    "alreadyUnderstood: string[] (o que o parser determinístico já extraiu)",
  ],
  outputs: [
    "caloriesOverride, mealsPerDay, budgetTight, emphasizePracticality, emphasizeSatiety, noCarbAtNight, addRestrictions",
    "unsupported: string[] (intenções reconhecidas que o sistema ainda não honra)",
  ],
  version: 1,
  history: ["v1: contrato inicial — só campos suportados; resto vai para unsupported"],
  template: `Você é o motor de interpretação de um sistema de nutrição esportiva brasileiro.
O treinador escreveu uma instrução em linguagem natural para ajustar o cardápio de um aluno.
Sua tarefa é traduzir a intenção APENAS nos campos suportados abaixo — nada além disso.

Campos suportados (e só eles):
- caloriesOverride: número inteiro de calorias/dia, ou null. (ex.: "1700 kcal" -> 1700)
- mealsPerDay: inteiro de 3 a 6, ou null.
- budgetTight: true se pedir dieta barata/econômica.
- emphasizePracticality: true se pedir refeições rápidas/práticas/sem cozinhar.
- emphasizeSatiety: true se pedir mais saciedade/controle de fome.
- noCarbAtNight: true SOMENTE se pedir sem/zero carboidrato especificamente à noite/jantar/ceia.
- addRestrictions: subconjunto de ["sem_lactose","sem_gluten","vegetariano","vegano"].

Regras:
- O parser determinístico já entendeu: {{alreadyUnderstood}}. Complemente, não repita à toa.
- Se a instrução pedir algo REAL mas fora dos campos acima (ex.: evitar um alimento específico,
  ajustar uma refeição isolada, trocar horários), NÃO invente um campo: descreva em "unsupported"
  com uma frase curta em português (ex.: "evitar amendoim").
- Nunca chute números. Se não houver calorias explícitas, caloriesOverride = null.
- Responda SOMENTE com um JSON válido, sem texto ao redor, no formato:
{
  "caloriesOverride": null,
  "mealsPerDay": null,
  "budgetTight": false,
  "emphasizePracticality": false,
  "emphasizeSatiety": false,
  "noCarbAtNight": false,
  "addRestrictions": [],
  "unsupported": []
}

Instrução do treinador:
"""
{{instruction}}
"""`,
};
