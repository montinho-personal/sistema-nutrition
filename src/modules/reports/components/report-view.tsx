"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeftIcon, FileTextIcon, PrinterIcon, TargetIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/page-header";
import { EmptyState } from "@/shared/components/empty-state";
import { LoadingScreen } from "@/shared/components/loading-screen";
import { useLocalCollection } from "@/shared/hooks/use-local-collection";
import type { Student } from "@/modules/students/types";
import type { DiagnosisSession } from "@/modules/diagnosis/types";
import type { StrategyRecord } from "@/modules/strategy/types";
import type { FollowUp } from "@/modules/follow-ups/types";
import { curatedFoods } from "@/modules/foods/data/curatedFoods";
import { buildStudentReport } from "@/modules/reports/services";
import { useMacroParams } from "@/modules/settings/hooks/use-macro-params";
import { ReportDocument } from "@/modules/reports/components/report-document";

const EMPTY_STUDENTS: Student[] = [];
const EMPTY_SESSIONS: DiagnosisSession[] = [];
const EMPTY_RECORDS: StrategyRecord[] = [];
const EMPTY_FOLLOWUPS: FollowUp[] = [];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Relatório consolidado de um aluno, com ação de impressão/PDF. */
export function ReportView({ studentId }: { studentId: string }) {
  const students = useLocalCollection<Student[]>("students", EMPTY_STUDENTS);
  const sessions = useLocalCollection<DiagnosisSession[]>("diagnosis_sessions", EMPTY_SESSIONS);
  const records = useLocalCollection<StrategyRecord[]>("strategy_records", EMPTY_RECORDS);
  const allFollowUps = useLocalCollection<FollowUp[]>("followups", EMPTY_FOLLOWUPS);
  const macroParams = useMacroParams();

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

  const report = React.useMemo(() => {
    if (!student) return null;
    return buildStudentReport({
      student,
      session,
      record,
      followUps,
      foods: curatedFoods,
      generatedAt: todayIso(),
      macroParams,
    });
  }, [student, session, record, followUps, macroParams]);

  if (typeof window === "undefined") {
    return <LoadingScreen messages={["Preparando o relatório..."]} />;
  }

  if (!student) {
    return (
      <>
        <PageHeader title="Relatório" />
        <EmptyState
          icon={<FileTextIcon />}
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

  if (!report) {
    return (
      <>
        <PageHeader title="Relatório" description={student.fullName} />
        <EmptyState
          icon={<TargetIcon />}
          title="Complete a estratégia primeiro"
          description="O relatório consolida diagnóstico, estratégia, macros, plano e evolução. Conclua o diagnóstico e gere a Estratégia deste aluno."
          action={
            <Button asChild>
              <Link href={`/strategy/${student.id}`}>Ir para a estratégia</Link>
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          title="Relatório do aluno"
          description={student.fullName}
          actions={
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => window.print()}>
                <PrinterIcon className="size-4" />
                Imprimir / PDF
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/students">
                  <ArrowLeftIcon className="size-4" />
                  Alunos
                </Link>
              </Button>
            </div>
          }
        />
      </div>
      <ReportDocument report={report} />
    </>
  );
}
