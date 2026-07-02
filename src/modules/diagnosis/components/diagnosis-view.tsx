"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeftIcon, PencilIcon, StethoscopeIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { PageHeader } from "@/shared/components/page-header";
import { EmptyState } from "@/shared/components/empty-state";
import { LoadingScreen } from "@/shared/components/loading-screen";
import { useLocalCollection } from "@/shared/hooks/use-local-collection";
import type { Student } from "@/modules/students/types";
import { useDiagnosisSession } from "@/modules/diagnosis/hooks/use-diagnosis-session";
import { Interview } from "@/modules/diagnosis/components/interview";
import { DiagnosisSummary } from "@/modules/diagnosis/components/diagnosis-summary";

const EMPTY_STUDENTS: Student[] = [];

/** Fluxo do Diagnóstico Estratégico de um aluno (entrevista → resumo). */
export function DiagnosisView({ studentId }: { studentId: string }) {
  const students = useLocalCollection<Student[]>("students", EMPTY_STUDENTS);
  const student = React.useMemo(
    () => students.find((s) => s.id === studentId) ?? null,
    [students, studentId],
  );
  const { session, setAnswer, setStageIndex, complete, reopen } = useDiagnosisSession(studentId);

  // A sessão é criada no cliente (efeito). Quando existir, já estamos no
  // cliente e a lista de alunos reflete a store real.
  if (!session) {
    return <LoadingScreen messages={["Carregando o diagnóstico..."]} />;
  }

  if (!student) {
    return (
      <>
        <PageHeader title="Diagnóstico" />
        <EmptyState
          icon={<StethoscopeIcon />}
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

  const completed = session.status === "completed";

  return (
    <>
      <PageHeader
        title="Diagnóstico Estratégico"
        description={student.fullName}
        actions={
          <div className="flex items-center gap-2">
            {completed ? (
              <Badge variant="success">Concluído</Badge>
            ) : (
              <Badge variant="warning">Em andamento</Badge>
            )}
            <Button asChild variant="ghost" size="sm">
              <Link href="/students">
                <ArrowLeftIcon className="size-4" />
                Alunos
              </Link>
            </Button>
          </div>
        }
      />

      {completed ? (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={reopen}>
              <PencilIcon className="size-4" />
              Revisar respostas
            </Button>
          </div>
          <DiagnosisSummary answers={session.answers} student={student} />
        </div>
      ) : (
        <Interview
          answers={session.answers}
          stageIndex={session.currentStageIndex}
          onAnswer={setAnswer}
          onStageChange={setStageIndex}
          onComplete={complete}
        />
      )}
    </>
  );
}
