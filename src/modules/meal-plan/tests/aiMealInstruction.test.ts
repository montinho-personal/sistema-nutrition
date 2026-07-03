import { describe, expect, it } from "vitest";

import {
  parseInstructionResponse,
  renderMealInstructionPrompt,
} from "@/modules/meal-plan/services/aiMealInstruction";
import { mergeDirectives, parseDirective } from "@/modules/meal-plan/services";

describe("renderMealInstructionPrompt", () => {
  it("preenche a instrução e o que já foi entendido, sem deixar placeholders", () => {
    const prompt = renderMealInstructionPrompt("sem amendoim, 1700 kcal", ["1700 kcal"]);
    expect(prompt).toContain("sem amendoim");
    expect(prompt).toContain("1700 kcal");
    expect(prompt).not.toContain("{{");
  });
});

describe("parseInstructionResponse — valida e normaliza a resposta da IA", () => {
  it("aceita uma resposta bem formada (mesmo com texto em volta) e filtra restrições", () => {
    const text = `Claro:
    { "caloriesOverride": 1700, "mealsPerDay": 4, "budgetTight": true,
      "emphasizePracticality": false, "emphasizeSatiety": false, "noCarbAtNight": true,
      "addRestrictions": ["sem_lactose", "invalida"], "unsupported": ["evitar amendoim"] }
    Pronto.`;
    const d = parseInstructionResponse(text)!;
    expect(d).not.toBeNull();
    expect(d.caloriesOverride).toBe(1700);
    expect(d.noCarbAtNight).toBe(true);
    expect(d.addRestrictions).toEqual(["sem_lactose"]); // "invalida" descartada
    expect(d.unsupported).toContain("evitar amendoim");
    expect(d.recognized).toContain("1700 kcal");
  });

  it("limita calorias absurdas e devolve null sem JSON", () => {
    const d = parseInstructionResponse('{ "caloriesOverride": 99999, "addRestrictions": [] }')!;
    expect(d.caloriesOverride).toBeLessThanOrEqual(6000);
    expect(parseInstructionResponse("não consegui")).toBeNull();
  });
});

describe("mergeDirectives — determinístico soberano nos números", () => {
  it("o número do parser vence; booleanos e restrições se unem", () => {
    const base = parseDirective("1700 kcal, sem lactose");
    const ai = parseInstructionResponse(
      '{ "caloriesOverride": 1200, "budgetTight": true, "addRestrictions": ["vegano"], "unsupported": ["mais proteína no café"] }',
    )!;
    const m = mergeDirectives(base, ai);
    expect(m.caloriesOverride).toBe(1700); // IA não sobrescreve o número já capturado
    expect(m.budgetTight).toBe(true); // veio da IA
    expect(m.addRestrictions).toEqual(expect.arrayContaining(["sem_lactose", "vegano"]));
    expect(m.unsupported).toContain("mais proteína no café");
  });
});
