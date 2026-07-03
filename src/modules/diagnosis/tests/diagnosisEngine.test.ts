import { describe, expect, it } from "vitest";

import {
  buildAnamnesePortrait,
  buildExecutiveSummary,
  computeHypotheses,
  computeOverallConfidence,
  computeScoreMap,
} from "@/modules/diagnosis/services";
import {
  visibleQuestions,
  visibleQuestionsForStage,
} from "@/modules/diagnosis/constants/questionnaire";
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

  it("aprofunda os gatilhos só quando há compulsão", () => {
    const sem = visibleQuestionsForStage("comportamento", { compulsion: "nao" });
    expect(sem.some((q) => q.key === "compulsion_trigger")).toBe(false);
    const com = visibleQuestionsForStage("comportamento", { compulsion: "frequente" });
    expect(com.some((q) => q.key === "compulsion_trigger")).toBe(true);
  });

  it("pergunta a frequência de álcool só quando o aluno bebe", () => {
    const sem = visibleQuestionsForStage("alimentacao", { beverages: ["cafe"] });
    expect(sem.some((q) => q.key === "alcohol_frequency")).toBe(false);
    const com = visibleQuestionsForStage("alimentacao", { beverages: ["cafe", "alcool"] });
    expect(com.some((q) => q.key === "alcohol_frequency")).toBe(true);
  });

  it("detalha a condição de saúde só quando é diabetes/outra", () => {
    const base = visibleQuestionsForStage("saude", { health_conditions: ["nenhuma"] });
    expect(base.some((q) => q.key === "diabetes_med")).toBe(false);
    const diab = visibleQuestionsForStage("saude", { health_conditions: ["diabetes"] });
    expect(diab.some((q) => q.key === "diabetes_med")).toBe(true);
  });
});

describe("grau de confiança", () => {
  it("não penaliza por perguntas condicionais que nem apareceram", () => {
    // Duas situações com o MESMO nº de respostas dadas, mas uma abre condicionais.
    const semRamo: AnswerMap = { compulsion: "nao", beverages: ["cafe"] };
    const comRamo: AnswerMap = { compulsion: "frequente", beverages: ["alcool"] };
    // Quem abriu ramos e não os respondeu deve ter confiança MENOR
    // (mais perguntas aplicáveis em aberto), nunca maior.
    expect(computeOverallConfidence(comRamo)).toBeLessThanOrEqual(
      computeOverallConfidence(semRamo),
    );
  });

  it("responder um ramo aberto recupera a confiança", () => {
    const aberto: AnswerMap = { compulsion: "frequente" };
    const respondido: AnswerMap = { compulsion: "frequente", compulsion_trigger: ["estresse"] };
    expect(computeOverallConfidence(respondido)).toBeGreaterThan(
      computeOverallConfidence(aberto),
    );
  });
});

describe("hipóteses do recordatório alimentar", () => {
  it("beliscar o dia todo vira dificuldade de estrutura", () => {
    const hs = computeHypotheses({ meals_per_day: "beliscando" });
    expect(hs.some((h) => h.id === "sem_estrutura_refeicoes")).toBe(true);
  });

  it("gatilho emocional é reconhecido como risco", () => {
    const hs = computeHypotheses({ compulsion_trigger: ["estresse", "tedio"] });
    const risco = hs.find((h) => h.id === "gatilho_emocional");
    expect(risco?.dimension).toBe("risk");
  });

  it("baixa hidratação vira oportunidade de vitória rápida", () => {
    const hs = computeHypotheses({ water_intake: "menos_1l" });
    expect(hs.some((h) => h.id === "hidratacao_baixa" && h.dimension === "opportunity")).toBe(true);
  });

  it("calorias líquidas: álcool diário tem mais confiança que refrigerante", () => {
    const alcool = computeHypotheses({ alcohol_frequency: "quase_diario" }).find(
      (h) => h.id === "calorias_liquidas",
    );
    const refri = computeHypotheses({ beverages: ["refrigerante"] }).find(
      (h) => h.id === "calorias_liquidas",
    );
    expect(alcool && refri).toBeTruthy();
    expect(alcool!.confidence).toBeGreaterThan(refri!.confidence);
  });
});

describe("retrato alimentar", () => {
  it("agrupa e traduz as respostas em rótulos legíveis, sem seções vazias", () => {
    const answers: AnswerMap = {
      meals_per_day: "beliscando",
      breakfast: "café com pão",
      beverages: ["cafe", "alcool"],
      disliked_foods: "jiló",
    };
    const portrait = buildAnamnesePortrait(answers);
    const dia = portrait.find((g) => g.title === "Dia alimentar");
    expect(dia).toBeDefined();
    // Valor de opção é traduzido para o rótulo escolhido.
    expect(dia!.items.find((i) => i.label === "Refeições por dia")?.value).toBe(
      "Belisco o dia todo, sem hora certa",
    );
    // Multi vira lista de rótulos.
    expect(dia!.items.find((i) => i.label === "Bebidas")?.value).toContain("Café");
    // Texto livre é preservado.
    const pref = portrait.find((g) => g.title === "Preferências e restrições");
    expect(pref!.items.find((i) => i.label === "Não come")?.value).toBe("jiló");
    // Nada de grupos vazios.
    expect(portrait.every((g) => g.items.length > 0)).toBe(true);
  });

  it("sem respostas, o retrato é vazio", () => {
    expect(buildAnamnesePortrait({})).toHaveLength(0);
  });

  it("sem respostas, as condicionais fechadas ficam de fora e o recordatório aparece", () => {
    const keys = visibleQuestions({}).map((q) => q.key);
    // Condicionais que só surgem com um gatilho não entram no set padrão.
    expect(keys).not.toContain("current_diet_detail"); // só se já segue dieta
    expect(keys).not.toContain("regain_trigger"); // só no efeito sanfona
    expect(keys).not.toContain("training_type"); // só se treina
    expect(keys).not.toContain("meals_out_food"); // só se come fora
    // Por padrão, descobrimos o dia alimentar (quem não segue dieta).
    expect(keys).toContain("breakfast");
  });

  it("quem já segue dieta troca o recordatório pelo relato detalhado", () => {
    const keys = visibleQuestions({ follows_diet: "sim" }).map((q) => q.key);
    expect(keys).toContain("current_diet_detail");
    expect(keys).not.toContain("breakfast");
  });
});
