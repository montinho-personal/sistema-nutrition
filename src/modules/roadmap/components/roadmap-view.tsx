"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeftIcon, MapIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/page-header";
import { EmptyState } from "@/shared/components/empty-state";
import { LoadingScreen } from "@/shared/components/loading-screen";
import { useLocalCollection } from "@/shared/hooks/use-local-collection";
import { STUDENT_GOAL_LABELS } from "@/modules/students/constants";
import type { Student } from "@/modules/students/types";
import type { DiagnosisSession } from "@/modules/diagnosis/types";
import type { StrategyRecord } from "@/modules/strategy/types";
import type { FollowUp } from "@/modules/follow-ups/types";
import {
  ageFromBirthDate,
  buildExecutiveSummary,
  computeScoreMap,
  readTrainingContext,
} from "@/modules/diagnosis/services";
import { buildStrategy, computeMacros } from "@/modules/strategy/services";
import type { MacroContext } from "@/modules/strategy/types";
import { computeEvolution, expectedWeeklyKgFromMacros } from "@/modules/follow-ups/services";
import { buildRoadmap, type RoadmapContext } from "@/modules/roadmap/services";
import { TransformationPanel } from "@/modules/roadmap/components/transformation-panel";
import { RoadmapPhases } from "@/modules/roadmap/components/roadmap-phases";

const EMPTY_STUDENTS: Student[] = [];
const EMPTY_SESSIONS: DiagnosisSession[] = [];
const EMPTY_RECORDS: StrategyRecord[] = [];
const EMPTY_FOLLOWUPS: FollowUp[] = [];

/**
 * Roadmap da Transformação de um aluno. Ao contrário dos demais módulos, mostra
 * a jornada desde o início — mesmo antes do diagnóstico, indica o caminho.
 */
export function RoadmapView({ studentId }: { studentId: string }) {
  const students = useLocalCollection<Student[]>("students", EMPTY_STUDENTS);
  const sessions = useLocalCollection<DiagnosisSession[]>("diagnosis_sessions", EMPTY_SESSIONS);
  const records = useLocalCollection<StrategyRecord[]>("strategy_records", EMPTY_RECORDS);
  const allFollowUps = useLocalCollection<FollowUp[]>("followups", EMPTY_FOLLOWUPS);

  const student = React.useMemo(
    () => students.find((s) => s.id === studentId) ?? null,
    [students, studentId],
  );
  const session = React.useMemo(
    () =>
      sessions
        .filter((s) => s.studentId === studentId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null,
    [sessions, studentId],
  );
  const record = React.useMemo(
    () => records.find((r) => r.studentId === studentId) ?? null,
    [records, studentId],
  );
  const followUps = React.useMemo(
    () =>
      allFollowUps
        .filter((f) => f.studentId === studentId)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [allFollowUps, studentId],
  );

  const roadmap = React.useMemo(() => {
    if (!student) return null;
    const hasDiagnosis = session?.status === "completed";

    const ctx: RoadmapContext = {
      hasDiagnosis: Boolean(hasDiagnosis),
      hasStrategy: false,
      direction: null,
      velocity: null,
      followUpCount: followUps.length,
      weeksElapsed: 0,
      mainChallenge: null,
      mainOpportunity: null,
      startWeight: null,
      currentWeight: null,
      totalChangeKg: null,
      lastActivityDate: null,
    };

    if (hasDiagnosis && session && student.mainGoal) {
      const summary = buildExecutiveSummary(session.answers, {
        goalLabel: STUDENT_GOAL_LABELS[student.mainGoal],
        ageYears: ageFromBirthDate(student.birthDate),
      });
      ctx.mainChallenge = summary.mainDifficulty;
      ctx.mainOpportunity = summary.mainOpportunity;

      if (record) {
        ctx.hasStrategy = true;
        const scores = computeScoreMap(session.answers);
        const strategy = buildStrategy(student.mainGoal, scores, session.answers);
        ctx.direction = strategy.direction;
        ctx.velocity = strategy.velocity;

        const macroCtx: MacroContext = {
          weightKg: record.input.currentWeightKg,
          bodyFatPct: record.input.bodyFatPct,
          heightCm: student.heightCm,
          ageYears: ageFromBirthDate(student.birthDate),
          sex: student.sex,
          activity: (session.answers.activity as string | undefined) ?? null,
          trains: (session.answers.trains as string | undefined) ?? null,
          ...readTrainingContext(session.answers),
        };
        const macros = computeMacros(
          student.mainGoal,
          strategy.direction,
          strategy.velocity,
          macroCtx,
        );
        const expectedWeeklyKg = expectedWeeklyKgFromMacros(
          strategy.direction,
          macros.tdee,
          macros.calories,
        );
        const evolution = computeEvolution(
          record.input.currentWeightKg,
          record.createdAt.slice(0, 10),
          followUps,
          expectedWeeklyKg,
        );
        ctx.startWeight = evolution.startWeight;
        ctx.currentWeight = evolution.currentWeight;
        ctx.totalChangeKg = evolution.totalChangeKg;
        ctx.weeksElapsed = evolution.weeksElapsed;
        ctx.lastActivityDate = followUps.at(-1)?.date ?? record.createdAt.slice(0, 10);
      }
    }

    return buildRoadmap(ctx);
  }, [student, session, record, followUps]);

  if (typeof window === "undefined") {
    return <LoadingScreen messages={["Traçando o caminho..."]} />;
  }

  if (!student || !roadmap) {
    return (
      <>
        <PageHeader title="Roadmap" />
        <EmptyState
          icon={<MapIcon />}
          title="Aluno não encontrado"
          description="Esse aluno não existe neste dispositivo. Volte e selecione um aluno da lista."
          action={
            <Button asChild variant="outline">
              <Link href="/students">
                <ArrowLeftIcon className="size-4" />
                Ver alunos
              </Link>
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Roadmap da Transformação"
        description={student.fullName}
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link href="/students">
              <ArrowLeftIcon className="size-4" />
              Alunos
            </Link>
          </Button>
        }
      />
      <div className="flex flex-col gap-8">
        <TransformationPanel roadmap={roadmap} />
        <RoadmapPhases roadmap={roadmap} />
      </div>
    </>
  );
}
