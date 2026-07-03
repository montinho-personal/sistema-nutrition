import { describe, expect, it } from "vitest";

import { buildDiagnosisDashboard } from "@/modules/diagnosis/services/diagnosisDashboard";
import { computeScoreMap } from "@/modules/diagnosis/services";
import { PROTEIN_G_PER_KG } from "@/modules/strategy/constants/parameters";
import type { AnswerMap } from "@/modules/diagnosis/types";

const baseInput = (answers: AnswerMap, over: Partial<Parameters<typeof buildDiagnosisDashboard>[0]> = {}) =>
  buildDiagnosisDashboard({
    answers,
    scores: computeScoreMap(answers),
    goal: "weight_loss",
    ageYears: 36,
    weightKg: 82,
    heightCm: 178,
    tdee: 2725,
    ...over,
  });

describe("dashboard do diagnóstico", () => {
  it("classifica o IMC a partir de peso e altura", () => {
    const d = baseInput({});
    // 82 / (1.78^2) = 25.9 → sobrepeso
    expect(d.imc?.value).toBe(25.9);
    expect(d.imc?.label).toBe("Sobrepeso");
  });

  it("estima proteína (por objetivo), fibras e água de forma determinística", () => {
    const d = baseInput({});
    expect(d.estimates.proteinG).toBe(Math.round(PROTEIN_G_PER_KG.weight_loss * 82));
    expect(d.estimates.proteinPerKg).toBe(PROTEIN_G_PER_KG.weight_loss);
    // fibra = 2725/1000 * 14 ≈ 38
    expect(d.estimates.fiberG).toBe(Math.round((2725 / 1000) * 14));
    // água = 35 ml/kg * 82 = 2870 ml
    expect(d.estimates.recommendedWaterMl).toBe(35 * 82);
    expect(d.estimates.currentIntakeKcal).toBe(2725);
  });

  it("lê a água atual da resposta da anamnese", () => {
    const d = baseInput({ water_intake: "menos_1l" });
    expect(d.estimates.currentWaterL).toBe(0.75);
    // hidratação vira objetivo secundário
    expect(d.objectives.secondary).toContain("melhorar a hidratação");
  });

  it("gradua a dificuldade e escreve um parecer não vazio", () => {
    const d = baseInput({ discipline: 9, self_efficacy: 9, planning: 9 });
    expect(["baixo", "medio", "alto"]).toContain(d.difficulty.level);
    expect(d.parecer.length).toBeGreaterThan(40);
    expect(d.parecer).toContain("2725 kcal");
    expect(d.objectives.main).toBe("Emagrecimento");
  });

  it("sem peso: omite IMC e estimativas dependentes, mas mantém dificuldade e parecer", () => {
    const d = baseInput({}, { weightKg: null, heightCm: null, tdee: null });
    expect(d.imc).toBeNull();
    expect(d.estimates.proteinG).toBeNull();
    expect(d.estimates.recommendedWaterMl).toBeNull();
    expect(d.parecer.length).toBeGreaterThan(20);
    expect(d.difficulty.level).toBeDefined();
  });
});
