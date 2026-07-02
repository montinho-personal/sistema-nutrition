/**
 * Status da jornada de um aluno para a Central de Decisão (Documento 09).
 *
 * Determina a fase atual e a próxima ação recomendada a partir do estado real —
 * reaproveitando o `buildStudentReport` (Documento 17 — reutilizar, nunca
 * duplicar). Determinístico (Documento 08).
 */

import type { Student } from "@/modules/students/types";
import type { DiagnosisSession } from "@/modules/diagnosis/types";
import type { StrategyRecord } from "@/modules/strategy/types";
import type { FollowUp } from "@/modules/follow-ups/types";
import type { Food } from "@/modules/foods/types";
import type { EvolutionStatus } from "@/modules/follow-ups/types";
import { buildStudentReport } from "@/modules/reports/services";

/** Etapa macro da jornada (para o resumo e a próxima ação). */
export type JourneyStage = "needs_diagnosis" | "needs_strategy" | "needs_followup" | "on_track";

export interface StudentJourney {
  student: Student;
  stage: JourneyStage;
  phaseTitle: string;
  nextAction: { label: string; href: string };
  weightChangeKg: number | null;
  evolutionStatus: EvolutionStatus | null;
}

export interface StudentJourneyInput {
  student: Student;
  session: DiagnosisSession | null;
  record: StrategyRecord | null;
  followUps: FollowUp[];
  foods: Food[];
  /** Data de referência (yyyy-mm-dd). */
  today: string;
}

/** Computa a jornada do aluno e a próxima ação recomendada. */
export function computeStudentJourney(input: StudentJourneyInput): StudentJourney {
  const { student, session, record, followUps, foods, today } = input;
  const id = student.id;
  const hasDiagnosis = session?.status === "completed";
  const hasStrategy = Boolean(record) && Boolean(student.mainGoal) && hasDiagnosis;

  if (!hasDiagnosis) {
    return {
      student,
      stage: "needs_diagnosis",
      phaseTitle: "Diagnóstico",
      nextAction: { label: "Fazer diagnóstico", href: `/diagnosis/${id}` },
      weightChangeKg: null,
      evolutionStatus: null,
    };
  }

  if (!hasStrategy) {
    return {
      student,
      stage: "needs_strategy",
      phaseTitle: "Preparação",
      nextAction: { label: "Definir estratégia", href: `/strategy/${id}` },
      weightChangeKg: null,
      evolutionStatus: null,
    };
  }

  const report = buildStudentReport({ student, session, record, followUps, foods, generatedAt: today });
  const currentPhase = report?.roadmap.phases.find((p) => p.status === "current");
  const phaseTitle = currentPhase?.title ?? "Implementação";

  if (followUps.length === 0) {
    return {
      student,
      stage: "needs_followup",
      phaseTitle,
      nextAction: { label: "Registrar acompanhamento", href: `/follow-ups/${id}` },
      weightChangeKg: null,
      evolutionStatus: null,
    };
  }

  return {
    student,
    stage: "on_track",
    phaseTitle,
    nextAction: { label: "Ver relatório", href: `/reports/${id}` },
    weightChangeKg: report?.evolution?.totalChangeKg ?? null,
    evolutionStatus: report?.evolution?.status ?? null,
  };
}
