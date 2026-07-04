/**
 * Camada de IA da instrução do treinador (Personal Nutrition AI — Fatia A.2). A
 * interpretação determinística é a base; aqui a IA lê o texto livre e devolve a
 * MESMA estrutura de restrições, declarando o que não sabe honrar. Reaproveita a
 * chamada crua à Anthropic do recordatório (a chave é secreta, só no servidor).
 */

import { z } from "zod";

import { mealInstructionPrompt } from "@/prompts/mealInstruction";
import { describeDirective } from "@/modules/meal-plan/services/mealPlanDirective";
import { RESTRICTION_LABELS } from "@/modules/meal-plan/services/dietaryFilters";
import { DIRECTIVE_LIMITS } from "@/modules/meal-plan/constants/parameters";
import type { MealPlanDirective } from "@/modules/meal-plan/types";

const ALLOWED_RESTRICTIONS = new Set(["sem_lactose", "sem_gluten", "vegetariano", "vegano"]);
const MAX_UNSUPPORTED = 5;

const responseSchema = z.object({
  caloriesOverride: z.number().int().positive().nullable().catch(null),
  mealsPerDay: z.number().int().nullable().catch(null),
  budgetTight: z.boolean().catch(false),
  emphasizePracticality: z.boolean().catch(false),
  emphasizeSatiety: z.boolean().catch(false),
  noCarbAtNight: z.boolean().catch(false),
  addRestrictions: z.array(z.string()).catch([]),
  unsupported: z.array(z.string().min(1).max(80)).catch([]),
});

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Preenche o template centralizado com a instrução e o que o parser já entendeu. */
export function renderMealInstructionPrompt(instruction: string, alreadyUnderstood: string[]): string {
  const fills: Record<string, string> = {
    instruction,
    alreadyUnderstood: alreadyUnderstood.length ? alreadyUnderstood.join(", ") : "nada ainda",
  };
  return Object.entries(fills).reduce<string>(
    (tpl, [k, v]) => tpl.replaceAll(`{{${k}}}`, v),
    mealInstructionPrompt.template,
  );
}

/**
 * Extrai e valida a diretiva do texto da IA (ou null). Aplica os mesmos limites
 * do parser determinístico — a IA nunca produz alvos absurdos nem restrições
 * inventadas.
 */
export function parseInstructionResponse(text: string): MealPlanDirective | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;

  let json: unknown;
  try {
    json = JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }

  const parsed = responseSchema.safeParse(json);
  if (!parsed.success) return null;
  const r = parsed.data;

  const directive: MealPlanDirective = {
    caloriesOverride:
      r.caloriesOverride === null
        ? null
        : clamp(r.caloriesOverride, DIRECTIVE_LIMITS.minCalories, DIRECTIVE_LIMITS.maxCalories),
    mealsPerDay:
      r.mealsPerDay === null
        ? null
        : clamp(r.mealsPerDay, DIRECTIVE_LIMITS.minMeals, DIRECTIVE_LIMITS.maxMeals),
    budgetTight: r.budgetTight,
    emphasizePracticality: r.emphasizePracticality,
    emphasizeSatiety: r.emphasizeSatiety,
    noCarbAtNight: r.noCarbAtNight,
    addRestrictions: Array.from(new Set(r.addRestrictions.filter((x) => ALLOWED_RESTRICTIONS.has(x)))),
    mealFoods: {},
    recognized: [],
    unsupported: r.unsupported
      .filter((x) => !RESTRICTION_LABELS[x]) // ruído: rótulos já viram restrição
      .slice(0, MAX_UNSUPPORTED),
  };
  directive.recognized = describeDirective(directive);
  return directive;
}
