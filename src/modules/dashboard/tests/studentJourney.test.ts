import { describe, expect, it } from "vitest";

import { curatedFoods } from "@/modules/foods/data/curatedFoods";
import { computeStudentJourney } from "@/modules/dashboard/services";
import type { Student } from "@/modules/students/types";
import type { DiagnosisSession } from "@/modules/diagnosis/types";
import type { StrategyRecord } from "@/modules/strategy/types";
import type { FollowUp } from "@/modules/follow-ups/types";

const student: Student = {
  id: "s1",
  fullName: "Renato Teste",
  sex: "male",
  birthDate: "1990-05-10",
  heightCm: 178,
  mainGoal: "weight_loss",
  email: null,
  phone: null,
  notes: null,
  createdAt: "2026-05-01T12:00:00.000Z",
  updatedAt: "2026-05-01T12:00:00.000Z",
};

const completedSession: DiagnosisSession = {
  id: "dx1",
  studentId: "s1",
  status: "completed",
  answers: { discipline: 6, trains: "regular", activity: "moderado", restrictions: ["nenhuma"] },
  currentStageIndex: 9,
  startedAt: "2026-05-01T12:00:00.000Z",
  updatedAt: "2026-05-01T12:10:00.000Z",
  completedAt: "2026-05-01T12:10:00.000Z",
};

const record: StrategyRecord = {
  studentId: "s1",
  input: { currentWeightKg: 92, bodyFatPct: 24 },
  createdAt: "2026-05-01T12:00:00.000Z",
  updatedAt: "2026-05-01T12:00:00.000Z",
};

const base = { student, foods: curatedFoods, today: "2026-06-01" };

describe("computeStudentJourney — próxima ação", () => {
  it("sem diagnóstico → fazer diagnóstico", () => {
    const j = computeStudentJourney({ ...base, session: null, record: null, followUps: [] });
    expect(j.stage).toBe("needs_diagnosis");
    expect(j.nextAction.href).toBe("/diagnosis/s1");
  });

  it("diagnóstico feito, sem estratégia → definir estratégia", () => {
    const j = computeStudentJourney({ ...base, session: completedSession, record: null, followUps: [] });
    expect(j.stage).toBe("needs_strategy");
    expect(j.nextAction.href).toBe("/strategy/s1");
  });

  it("estratégia feita, sem acompanhamento → registrar acompanhamento", () => {
    const j = computeStudentJourney({ ...base, session: completedSession, record, followUps: [] });
    expect(j.stage).toBe("needs_followup");
    expect(j.nextAction.href).toBe("/follow-ups/s1");
    expect(j.phaseTitle).toBe("Implementação");
  });

  it("com acompanhamento → ver relatório, com variação de peso", () => {
    const followUps: FollowUp[] = [
      {
        id: "fu1",
        studentId: "s1",
        date: "2026-05-29",
        weightKg: 90.4,
        scales: { adherence: 7, hunger: 5, sleep: 7, energy: 7, mood: 7 },
        measurements: null,
        whatWorked: null,
        whatFailed: null,
        why: null,
        createdAt: "2026-05-29T09:00:00.000Z",
      },
    ];
    const j = computeStudentJourney({ ...base, session: completedSession, record, followUps });
    expect(j.stage).toBe("on_track");
    expect(j.nextAction.href).toBe("/reports/s1");
    expect(j.weightChangeKg).toBeCloseTo(-1.6, 1);
    expect(j.evolutionStatus).not.toBeNull();
  });
});
