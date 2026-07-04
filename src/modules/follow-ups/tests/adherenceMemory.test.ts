import { describe, expect, it } from "vitest";

import {
  buildMemoryNarrative,
  computeEvolution,
  expectedWeeklyKgFromMacros,
  summarizeAdherenceSignals,
} from "@/modules/follow-ups/services";
import type { FollowUp, FollowUpScales } from "@/modules/follow-ups/types";

function scales(over: Partial<FollowUpScales> = {}): FollowUpScales {
  return { adherence: 8, hunger: 4, sleep: 7, energy: 7, mood: 7, ...over };
}

function followUp(over: Partial<FollowUp> = {}): FollowUp {
  return {
    id: over.id ?? "f1",
    studentId: "s1",
    date: over.date ?? "2026-02-01",
    weightKg: over.weightKg ?? 87,
    scales: over.scales ?? scales(),
    measurements: null,
    whatWorked: over.whatWorked ?? null,
    whatFailed: over.whatFailed ?? null,
    why: null,
    createdAt: over.createdAt ?? "2026-02-01",
  };
}

describe("summarizeAdherenceSignals — adaptações seguras do histórico", () => {
  it("sem acompanhamentos, nada é sinalizado", () => {
    const s = summarizeAdherenceSignals([]);
    expect(s.checkInCount).toBe(0);
    expect(s.emphasizeSatiety).toBe(false);
    expect(s.emphasizePracticality).toBe(false);
  });

  it("aderência baixa pede praticidade; fome alta pede saciedade", () => {
    const s = summarizeAdherenceSignals([
      followUp({ scales: scales({ adherence: 4, hunger: 8 }) }),
      followUp({ id: "f2", scales: scales({ adherence: 5, hunger: 8 }) }),
    ]);
    expect(s.emphasizePracticality).toBe(true);
    expect(s.emphasizeSatiety).toBe(true);
    expect(s.avgAdherence).toBeLessThanOrEqual(5);
  });

  it("aderência e fome sob controle não forçam adaptação", () => {
    const s = summarizeAdherenceSignals([followUp({ scales: scales({ adherence: 9, hunger: 3 }) })]);
    expect(s.emphasizePracticality).toBe(false);
    expect(s.emphasizeSatiety).toBe(false);
  });
});

describe("buildMemoryNarrative — o que o histórico ensinou", () => {
  it("sem histórico: primeira consulta", () => {
    const m = buildMemoryNarrative([], null);
    expect(m.hasHistory).toBe(false);
    expect(m.headline.toLowerCase()).toContain("primeira consulta");
    expect(m.recommendation).toBeNull();
  });

  it("com histórico: traz notas, aprendizados e a sugestão de ritmo", () => {
    const followUps = [
      followUp({
        date: "2026-02-01",
        weightKg: 87,
        scales: scales({ adherence: 4, hunger: 8 }),
        whatWorked: "Marmita no trabalho",
        whatFailed: "Doce à noite",
      }),
      followUp({
        id: "f2",
        date: "2026-02-15",
        weightKg: 86.8,
        scales: scales({ adherence: 5, hunger: 8 }),
      }),
    ];
    // Déficit previsto ~0,5 kg/sem, mas a perda real é lentíssima → "abaixo".
    const expected = expectedWeeklyKgFromMacros("deficit", 2700, 2200);
    const evolution = computeEvolution(88, "2026-01-18", followUps, expected);
    const m = buildMemoryNarrative(followUps, evolution);

    expect(m.hasHistory).toBe(true);
    expect(m.notes.join(" ")).toMatch(/praticidade|saciedade/);
    expect(m.whatWorked).toContain("Marmita no trabalho");
    expect(m.whatFailed).toContain("Doce à noite");
    expect(m.recommendation).not.toBeNull();
  });
});
