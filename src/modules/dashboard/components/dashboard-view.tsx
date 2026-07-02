"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  PlusIcon,
  StethoscopeIcon,
  TargetIcon,
  UserRoundIcon,
  UsersIcon,
} from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";
import { useLocalCollection } from "@/shared/hooks/use-local-collection";
import { STUDENT_GOAL_LABELS } from "@/modules/students/constants";
import type { Student } from "@/modules/students/types";
import type { DiagnosisSession } from "@/modules/diagnosis/types";
import type { StrategyRecord } from "@/modules/strategy/types";
import type { FollowUp } from "@/modules/follow-ups/types";
import { curatedFoods } from "@/modules/foods/data/curatedFoods";
import {
  computeStudentJourney,
  type JourneyStage,
  type StudentJourney,
} from "@/modules/dashboard/services";
import { useMacroParams } from "@/modules/settings/hooks/use-macro-params";

const EMPTY_STUDENTS: Student[] = [];
const EMPTY_SESSIONS: DiagnosisSession[] = [];
const EMPTY_RECORDS: StrategyRecord[] = [];
const EMPTY_FOLLOWUPS: FollowUp[] = [];

const STAGE_BADGE: Record<JourneyStage, { label: string; variant: "warning" | "secondary" | "success" }> = {
  needs_diagnosis: { label: "Diagnóstico pendente", variant: "warning" },
  needs_strategy: { label: "Sem estratégia", variant: "warning" },
  needs_followup: { label: "Aguardando acompanhamento", variant: "secondary" },
  on_track: { label: "Em acompanhamento", variant: "success" },
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function weightLabel(kg: number): string {
  const abs = Math.abs(kg).toFixed(1).replace(".", ",");
  const sign = kg > 0 ? "+" : kg < 0 ? "−" : "";
  return `${sign}${abs} kg`;
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <Card className="gap-0 py-4">
      <CardContent className="flex flex-col gap-0.5 px-4">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  );
}

function JourneyCard({ journey }: { journey: StudentJourney }) {
  const { student, stage, phaseTitle, nextAction, weightChangeKg } = journey;
  const badge = STAGE_BADGE[stage];

  return (
    <Card className="gap-3 py-4">
      <CardContent className="flex flex-col gap-3 px-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <UserRoundIcon className="size-5" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate text-sm font-medium">{student.fullName}</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {student.mainGoal ? (
                <Badge variant="secondary" className="text-[10px]">
                  {STUDENT_GOAL_LABELS[student.mainGoal]}
                </Badge>
              ) : null}
              <Badge variant={badge.variant} className="text-[10px]">
                {stage === "on_track" || stage === "needs_followup" ? phaseTitle : badge.label}
              </Badge>
              {weightChangeKg !== null ? (
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {weightLabel(weightChangeKg)}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="w-full justify-between">
          <Link href={nextAction.href}>
            {nextAction.label}
            <ArrowRightIcon className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Central de Decisão (Documento 09): visão executiva de todos os alunos, com
 * a fase atual e a próxima ação recomendada de cada um.
 */
export function DashboardView() {
  const students = useLocalCollection<Student[]>("students", EMPTY_STUDENTS);
  const sessions = useLocalCollection<DiagnosisSession[]>("diagnosis_sessions", EMPTY_SESSIONS);
  const records = useLocalCollection<StrategyRecord[]>("strategy_records", EMPTY_RECORDS);
  const followUps = useLocalCollection<FollowUp[]>("followups", EMPTY_FOLLOWUPS);
  const macroParams = useMacroParams();

  const journeys = React.useMemo(() => {
    const today = todayIso();
    return [...students]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((student) =>
        computeStudentJourney({
          student,
          session:
            sessions
              .filter((s) => s.studentId === student.id)
              .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null,
          record: records.find((r) => r.studentId === student.id) ?? null,
          followUps: followUps
            .filter((f) => f.studentId === student.id)
            .sort((a, b) => a.date.localeCompare(b.date)),
          foods: curatedFoods,
          today,
          macroParams,
        }),
      );
  }, [students, sessions, records, followUps, macroParams]);

  const stats = React.useMemo(
    () => ({
      total: journeys.length,
      needsDiagnosis: journeys.filter((j) => j.stage === "needs_diagnosis").length,
      needsStrategy: journeys.filter((j) => j.stage === "needs_strategy").length,
      tracking: journeys.filter((j) => j.stage === "on_track").length,
    }),
    [journeys],
  );

  const actionable = journeys.filter(
    (j) => j.stage === "needs_diagnosis" || j.stage === "needs_strategy",
  );
  const active = journeys.filter(
    (j) => j.stage === "needs_followup" || j.stage === "on_track",
  );

  return (
    <>
      <PageHeader
        title="Central de Decisão"
        description="Onde cada aluno está na jornada e o que fazer a seguir."
        actions={
          <Button asChild>
            <Link href="/students">
              <PlusIcon className="size-4" />
              Alunos
            </Link>
          </Button>
        }
      />

      {journeys.length === 0 ? (
        <EmptyState
          icon={<UsersIcon />}
          title="Comece cadastrando seu primeiro aluno"
          description="O Diagnóstico Estratégico — base de todas as decisões — começa a partir de um aluno."
          action={
            <Button asChild>
              <Link href="/students">Cadastrar aluno</Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Alunos" value={stats.total} />
            <StatTile label="Diagnóstico pendente" value={stats.needsDiagnosis} />
            <StatTile label="Sem estratégia" value={stats.needsStrategy} />
            <StatTile label="Em acompanhamento" value={stats.tracking} />
          </div>

          {actionable.length > 0 ? (
            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <StethoscopeIcon className="size-4 text-gold" />
                Precisam de ação
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {actionable.map((j) => (
                  <JourneyCard key={j.student.id} journey={j} />
                ))}
              </div>
            </section>
          ) : null}

          {active.length > 0 ? (
            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <TargetIcon className="size-4 text-gold" />
                Em andamento
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {active.map((j) => (
                  <JourneyCard key={j.student.id} journey={j} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}
