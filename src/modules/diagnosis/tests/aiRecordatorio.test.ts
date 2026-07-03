import { describe, expect, it } from "vitest";

import {
  parseAiResponse,
  renderRecordatorioPrompt,
} from "@/modules/diagnosis/services/aiRecordatorio";
import type { AnswerMap } from "@/modules/diagnosis/types";

describe("renderRecordatorioPrompt", () => {
  it("preenche os campos do template com os dados do recordatório", () => {
    const answers: AnswerMap = {
      breakfast: "café com pão",
      lunch: "arroz e frango",
      beverages: ["cafe", "refrigerante"],
      meals_per_day: "3",
    };
    const prompt = renderRecordatorioPrompt(answers, ["Café sem proteína"]);
    expect(prompt).toContain("café com pão");
    expect(prompt).toContain("arroz e frango");
    expect(prompt).toContain("cafe, refrigerante");
    expect(prompt).toContain("Café sem proteína");
    // Sem placeholders remanescentes.
    expect(prompt).not.toMatch(/\{\{\w+\}\}/);
  });

  it("usa marcadores neutros quando faltam campos", () => {
    const prompt = renderRecordatorioPrompt({}, []);
    expect(prompt).toContain("nenhuma"); // observações determinísticas vazias
    expect(prompt).not.toMatch(/\{\{\w+\}\}/);
  });
});

describe("parseAiResponse", () => {
  it("extrai observações de um JSON válido", () => {
    const text = JSON.stringify({
      observations: [
        { kind: "risk", title: "Excesso de sódio", detail: "Muitos ultraprocessados." },
        { kind: "opportunity", title: "Mais fibras", detail: "Incluir frutas e legumes." },
      ],
    });
    const obs = parseAiResponse(text);
    expect(obs).toHaveLength(2);
    expect(obs![0].kind).toBe("risk");
    expect(obs![0].id).toBe("ai_0");
  });

  it("extrai JSON mesmo com texto ao redor", () => {
    const text = 'Claro! Aqui está:\n{"observations":[{"kind":"recommendation","title":"X","detail":"Y"}]}\nEspero ajudar.';
    const obs = parseAiResponse(text);
    expect(obs).toHaveLength(1);
    expect(obs![0].kind).toBe("recommendation");
  });

  it("devolve null para JSON inválido", () => {
    expect(parseAiResponse("desculpe, não consigo")).toBeNull();
    expect(parseAiResponse("{ isto não é json }")).toBeNull();
  });

  it("devolve null quando o formato não bate com o schema", () => {
    // kind fora do enum
    const bad = JSON.stringify({ observations: [{ kind: "outro", title: "X", detail: "Y" }] });
    expect(parseAiResponse(bad)).toBeNull();
    // faltando 'detail'
    const missing = JSON.stringify({ observations: [{ kind: "risk", title: "X" }] });
    expect(parseAiResponse(missing)).toBeNull();
  });
});
