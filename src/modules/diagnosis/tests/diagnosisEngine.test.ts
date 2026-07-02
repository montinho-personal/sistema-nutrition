import { describe, expect, it } from "vitest";

import {
  buildExecutiveSummary,
  computeHypotheses,
  computeOverallConfidence,
  computeScoreMap,
} from "@/modules/diagnosis/services";
import { visibleQuestionsForStage } from "@/modules/diagnosis/constants/questionnaire";
import type { AnswerMap } from "@/modules/diagnosis/types";

describe("scoringEngine", () => {
  it("sem respostas, retorna a linha de base", () => {
    const s = computeScoreMap({});
    expect(s.adherence).toBe(50);
    expect(s.abandonmentRisk).toBe(30);
  });

  it("perfil de risco: sanfona + tudo-ou-nada eleva risco e derruba flexibilidade", () => {
    const answers: AnswerMap = { weight_history: "sanfona", all_or_nothing: 10 };
    const s = computeScoreMap(answers);
    expect(s.abandonmentRisk).toBeGreaterThan(60);
    expect(s.flexibility).toBeLessThan(20);
  });

  it("escala aplica contribuição proporcional ao valor", () => {
    // discipline: consistency +35 no máximo → em 10 vira 50+35=85
    expect(computeScoreMap({ discipline: 10 }).consistency).toBe(85);
    // em 5 (metade) → 50 + ~18 = 68
    expect(computeScoreMap({ discipline: 5 }).consistency).toBe(68);
  });

  it("mantém os scores entre 0 e 100", () => {
    const answers: AnswerMap = {
      weight_history: "sanfona",
      all_or_nothing: 10,
      compulsion: "frequente",
      hunger_level: 10,
      night_eating: "frequente",
    };
    const s = computeScoreMap(answers);
    for (const value of Object.values(s)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });

  it("regra numérica de sono penaliza quem dorme pouco", () => {
    expect(computeScoreMap({ sleep_hours: 4 }).consistency).toBeLessThan(
      computeScoreMap({ sleep_hours: 8 }).consistency,
    );
  });

  it("confiança sobe conforme perguntas são respondidas", () => {
    expect(computeOverallConfidence({})).toBe(0);
    const partial = computeOverallConfidence({ motivation_level: 8, budget: "medio" });
    expect(partial).toBeGreaterThan(0);
    expect(partial).toBeLessThan(100);
  });
});

describe("hypothesisEngine", () => {
  it("gera a hipótese de risco para sanfona + tudo-ou-nada, com confiança e justificativa", () => {
    const hs = computeHypotheses({ weight_history: "sanfona", all_or_nothing: 9 });
    const risk = hs.find((h) => h.id === "sanfona_tudo_ou_nada");
    expect(risk).toBeDefined();
    expect(risk!.confidence).toBeGreaterThan(80);
    expect(risk!.justification.length).toBeGreaterThan(0);
  });

  it("reconhece vantagem quando a motivação é alta", () => {
    const hs = computeHypotheses({ motivation_level: 10, self_efficacy: 10 });
    expect(hs.some((h) => h.dimension === "advantage")).toBe(true);
  });

  it("ordena por confiança (desc)", () => {
    const hs = computeHypotheses({
      weight_history: "sanfona",
      all_or_nothing: 9,
      budget: "apertado",
      hunger_level: 9,
    });
    for (let i = 1; i < hs.length; i++) {
      expect(hs[i - 1].confidence).toBeGreaterThanOrEqual(hs[i].confidence);
    }
  });
});

describe("executiveSummary", () => {
  it("monta perfil, riscos e estratégias promissoras", () => {
    const answers: AnswerMap = {
      weight_history: "sanfona",
      all_or_nothing: 9,
      hunger_level: 9,
      budget: "apertado",
      cook_availability: "quase_nunca",
    };
    const summary = buildExecutiveSummary(answers, { goalLabel: "Emagrecimento", ageYears: 34 });
    expect(summary.profile).toContain("34 anos");
    expect(summary.topRisks.length).toBeGreaterThan(0);
    expect(summary.promisingStrategies.length).toBeGreaterThan(0);
    // fome alta + praticidade baixa + orçamento apertado devem aparecer nas estratégias
    expect(summary.promisingStrategies.join(" ")).toMatch(/saciedade|praticidade|custo/i);
  });
});

describe("perguntas condicionais", () => {
  it("home_snacking só aparece para quem trabalha em casa", () => {
    const semHome = visibleQuestionsForStage("rotina", { work_location: "escritorio" });
    expect(semHome.some((q) => q.key === "home_snacking")).toBe(false);
    const comHome = visibleQuestionsForStage("rotina", { work_location: "home" });
    expect(comHome.some((q) => q.key === "home_snacking")).toBe(true);
  });
});
