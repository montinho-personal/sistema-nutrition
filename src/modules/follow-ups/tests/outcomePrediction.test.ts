import { describe, expect, it } from "vitest";

import { predictOutcome } from "@/modules/follow-ups/services/outcomePrediction";
import type { OutcomePredictionInput } from "@/modules/follow-ups/services";

// Emagrecer 8 kg em 16 semanas (ritmo seguro ~-0,5 kg/sem).
const base: OutcomePredictionInput = {
  direction: "deficit",
  startWeightKg: 90,
  targetChangeKg: 8,
  targetWeeks: 16,
  realWeeklyKg: -0.5,
  weeksElapsed: 4,
  dataPoints: 4,
};

describe("predictOutcome — sem previsão", () => {
  it("retorna null sem meta definida", () => {
    expect(predictOutcome({ ...base, targetChangeKg: null })).toBeNull();
    expect(predictOutcome({ ...base, targetWeeks: null })).toBeNull();
  });

  it("retorna null na manutenção (nada a prever no peso)", () => {
    expect(predictOutcome({ ...base, direction: "manutencao" })).toBeNull();
  });

  it("sem ritmo medido → veredito insuficiente", () => {
    const p = predictOutcome({ ...base, realWeeklyKg: null })!;
    expect(p.verdict).toBe("insufficient");
    expect(p.weeksToGoal).toBeNull();
  });
});

describe("predictOutcome — vereditos", () => {
  it("no ritmo exato da meta → on_track e ~16 semanas até a meta", () => {
    const p = predictOutcome(base)!;
    expect(p.verdict).toBe("on_track");
    expect(p.projectedChangeKg).toBe(-8);
    expect(p.onTrackPct).toBe(100);
    expect(p.weeksToGoal).toBe(16);
    expect(p.projectedWeightAtTarget).toBe(82);
  });

  it("ritmo mais rápido → adiantado", () => {
    const p = predictOutcome({ ...base, realWeeklyKg: -0.7 })!;
    expect(p.verdict).toBe("ahead");
    expect(p.onTrackPct).toBeGreaterThan(120);
  });

  it("ritmo mais lento → abaixo do previsto, com gap positivo", () => {
    const p = predictOutcome({ ...base, realWeeklyKg: -0.3 })!;
    expect(p.verdict).toBe("behind");
    expect(p.onTrackPct).toBeLessThan(80);
    expect(p.gapKg).toBeGreaterThan(0);
  });

  it("peso quase parado → estagnado", () => {
    const p = predictOutcome({ ...base, realWeeklyKg: -0.05 })!;
    expect(p.verdict).toBe("stalled");
  });

  it("ganhando peso enquanto a meta é perder → tendência contrária", () => {
    const p = predictOutcome({ ...base, realWeeklyKg: 0.3 })!;
    expect(p.verdict).toBe("reversing");
    expect(p.weeksToGoal).toBeNull();
  });

  it("funciona também para ganho (superávit)", () => {
    const p = predictOutcome({
      ...base,
      direction: "superavit",
      targetChangeKg: 4,
      realWeeklyKg: 0.25,
    })!;
    expect(p.plannedChangeKg).toBe(4);
    expect(p.projectedChangeKg).toBe(4);
    expect(p.verdict).toBe("on_track");
  });
});

describe("predictOutcome — confiança", () => {
  it("cresce com mais acompanhamentos e mais tempo", () => {
    const pouco = predictOutcome({ ...base, dataPoints: 1, weeksElapsed: 1 })!;
    const muito = predictOutcome({ ...base, dataPoints: 5, weeksElapsed: 8 })!;
    expect(muito.confidence).toBeGreaterThan(pouco.confidence);
    expect(muito.confidence).toBe(100);
  });
});
