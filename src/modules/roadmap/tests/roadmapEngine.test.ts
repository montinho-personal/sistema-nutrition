import { describe, expect, it } from "vitest";

import { buildRoadmap, type RoadmapContext } from "@/modules/roadmap/services";
import { TOTAL_PHASES } from "@/modules/roadmap/constants/phases";

function ctx(overrides: Partial<RoadmapContext> = {}): RoadmapContext {
  return {
    hasDiagnosis: true,
    hasStrategy: true,
    direction: "deficit",
    velocity: "moderada",
    followUpCount: 0,
    weeksElapsed: 0,
    mainChallenge: "Efeito sanfona",
    mainOpportunity: "Alta motivação",
    startWeight: 92,
    currentWeight: 92,
    totalChangeKg: 0,
    lastActivityDate: "2026-06-01",
    ...overrides,
  };
}

describe("buildRoadmap — fase atual por sinais", () => {
  it("sem diagnóstico → fase Diagnóstico", () => {
    const r = buildRoadmap(ctx({ hasDiagnosis: false, hasStrategy: false }));
    expect(r.currentPhase).toBe("diagnosis");
  });

  it("diagnóstico feito, sem estratégia → Preparação", () => {
    const r = buildRoadmap(ctx({ hasStrategy: false }));
    expect(r.currentPhase).toBe("preparation");
  });

  it("estratégia definida, sem acompanhamentos → Implementação", () => {
    const r = buildRoadmap(ctx({ followUpCount: 0 }));
    expect(r.currentPhase).toBe("implementation");
  });

  it("poucas semanas com acompanhamentos → ainda Implementação", () => {
    const r = buildRoadmap(ctx({ followUpCount: 2, weeksElapsed: 2 }));
    expect(r.currentPhase).toBe("implementation");
  });

  it("algumas semanas consistentes → Consolidação", () => {
    const r = buildRoadmap(ctx({ followUpCount: 3, weeksElapsed: 5 }));
    expect(r.currentPhase).toBe("consolidation");
  });

  it("muitas semanas → Otimização", () => {
    const r = buildRoadmap(ctx({ followUpCount: 6, weeksElapsed: 10 }));
    expect(r.currentPhase).toBe("optimization");
  });

  it("objetivo de manutenção avança para Manutenção com o tempo", () => {
    const early = buildRoadmap(ctx({ direction: "manutencao", followUpCount: 1, weeksElapsed: 2 }));
    expect(early.currentPhase).toBe("consolidation");
    const later = buildRoadmap(ctx({ direction: "manutencao", followUpCount: 4, weeksElapsed: 8 }));
    expect(later.currentPhase).toBe("maintenance");
  });
});

describe("buildRoadmap — estrutura e painel", () => {
  it("sempre lista as 7 fases com status coerente", () => {
    const r = buildRoadmap(ctx({ followUpCount: 3, weeksElapsed: 5 }));
    expect(r.phases).toHaveLength(TOTAL_PHASES);
    const current = r.phases.filter((p) => p.status === "current");
    expect(current).toHaveLength(1);
    const completed = r.phases.filter((p) => p.status === "completed");
    expect(completed.every((p) => p.position < current[0].position)).toBe(true);
  });

  it("painel traz objetivo, desafio, oportunidade, próxima meta e revisão", () => {
    const r = buildRoadmap(ctx({ followUpCount: 1, weeksElapsed: 1 }));
    expect(r.panel.currentPhaseTitle).toBe("Implementação");
    expect(r.panel.mainChallenge).toBe("Efeito sanfona");
    expect(r.panel.mainOpportunity).toBe("Alta motivação");
    expect(r.panel.nextGoal).toContain("Consolidação");
    // revisão = última atividade + cadência (moderada = 3 semanas)
    expect(r.panel.nextReview).toBe("2026-06-22");
  });

  it("velocidade intensiva encurta a cadência de revisão", () => {
    const r = buildRoadmap(ctx({ velocity: "intensiva", followUpCount: 1, weeksElapsed: 1 }));
    // 2026-06-01 + 2 semanas = 2026-06-15
    expect(r.panel.nextReview).toBe("2026-06-15");
  });

  it("conta as fases concluídas", () => {
    const r = buildRoadmap(ctx({ followUpCount: 6, weeksElapsed: 10 })); // otimização (pos 5)
    expect(r.journey.phasesCompleted).toBe(4);
    expect(r.journey.totalPhases).toBe(TOTAL_PHASES);
  });
});
