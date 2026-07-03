import { describe, expect, it } from "vitest";

import {
  parseDeepeningResponse,
  renderAnamneseDeepeningPrompt,
} from "@/modules/diagnosis/services/aiAnamneseDeepening";
import type { AnswerMap } from "@/modules/diagnosis/types";

const answers: AnswerMap = {
  breakfast: "café com pão",
  lunch: "arroz, feijão e frango",
  training_days_per_week: 4,
};

describe("aprofundamento da anamnese por IA — render do prompt", () => {
  it("inclui o objetivo e o resumo do que já foi respondido", () => {
    const prompt = renderAnamneseDeepeningPrompt(answers, "weight_loss");
    expect(prompt).toContain("Emagrecimento");
    // O resumo traz o que a anamnese capturou.
    expect(prompt.toLowerCase()).toContain("frango");
    // Não deixa placeholders por preencher.
    expect(prompt).not.toContain("{{");
  });
});

describe("aprofundamento da anamnese por IA — parse da resposta", () => {
  it("valida e normaliza uma resposta bem formada (mesmo com texto em volta)", () => {
    const text = `Claro! Aqui está:
{ "questions": [
  { "topic": "Sono", "question": "Quantas horas você dorme?", "why": "Sono baixo aumenta a fome." },
  { "topic": "Álcool", "question": "Bebe com que frequência?", "why": "Entra nas calorias da semana." }
] }
Espero ter ajudado.`;
    const out = parseDeepeningResponse(text);
    expect(out).not.toBeNull();
    expect(out).toHaveLength(2);
    expect(out![0].id).toBe("deep_0");
    expect(out![0].topic).toBe("Sono");
  });

  it("devolve null quando não há JSON válido", () => {
    expect(parseDeepeningResponse("desculpe, não consegui")).toBeNull();
    expect(parseDeepeningResponse('{ "questions": "errado" }')).toBeNull();
  });

  it("limita a 5 perguntas (contrato)", () => {
    const many = {
      questions: Array.from({ length: 8 }, (_, i) => ({
        topic: `T${i}`,
        question: `Q${i}?`,
        why: `W${i}`,
      })),
    };
    expect(parseDeepeningResponse(JSON.stringify(many))).toBeNull();
  });
});
