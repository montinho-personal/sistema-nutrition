import { describe, expect, it } from "vitest";

import { encodeAnamnese, decodeAnamnese, buildAnamneseUrl } from "@/modules/diagnosis/services";
import type { AnswerMap } from "@/modules/diagnosis/types";

const answers: AnswerMap = {
  motivation_level: 8,
  timeline: "moderado",
  restrictions: ["vegetariano", "sem_lactose"],
  favorite_foods: "pão, café — açaí à noite",
  sleep_hours: 7,
};

describe("shareCodec", () => {
  it("codifica e decodifica preservando o payload (round-trip)", () => {
    const code = encodeAnamnese({ studentId: "s1", studentName: "Ana Álvares", answers });
    const decoded = decodeAnamnese(code);
    expect(decoded).not.toBeNull();
    expect(decoded!.studentId).toBe("s1");
    expect(decoded!.studentName).toBe("Ana Álvares");
    expect(decoded!.answers).toEqual(answers);
  });

  it("preserva acentos e caracteres especiais", () => {
    const code = encodeAnamnese({
      studentId: "s2",
      studentName: "José",
      answers: { favorite_foods: "açaí, pão de queijo, maçã" },
    });
    expect(decodeAnamnese(code)!.answers.favorite_foods).toBe("açaí, pão de queijo, maçã");
  });

  it("gera código seguro para URL (sem +, /, =)", () => {
    const code = encodeAnamnese({ studentId: "s1", studentName: "Teste", answers });
    expect(code).not.toMatch(/[+/=]/);
  });

  it("retorna null para código inválido", () => {
    expect(decodeAnamnese("")).toBeNull();
    expect(decodeAnamnese("não-é-base64-válido!!!")).toBeNull();
    expect(decodeAnamnese("YWJj")).toBeNull(); // base64 de "abc" (não é payload)
  });

  it("monta o link público com os parâmetros do aluno", () => {
    const url = buildAnamneseUrl("https://exemplo.com", "s1", "Ana Souza");
    expect(url.startsWith("https://exemplo.com/anamnese?")).toBe(true);
    expect(url).toContain("s=s1");
    expect(url).toContain("n=Ana+Souza");
  });
});
