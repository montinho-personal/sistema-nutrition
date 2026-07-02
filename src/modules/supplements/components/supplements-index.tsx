"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRightIcon, PillIcon, StethoscopeIcon, UsersIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";
import { useLocalCollection } from "@/shared/hooks/use-local-collection";
import { STUDENT_GOAL_LABELS } from "@/modules/students/constants";
import type { Student } from "@/modules/students/types";
import type { DiagnosisSession } from "@/modules/diagnosis/types";

const EMPTY_STUDENTS: Student[] = [];
const EMPTY_SESSIONS: DiagnosisSession[] = [];

/** Índice da Suplementação: parte do diagnóstico (as dificuldades reais). */
export function SupplementsIndex() {
  const students = useLocalCollection<Student[]>("students", EMPTY_STUDENTS);
  const sessions = useLocalCollection<DiagnosisSession[]>("diagnosis_sessions", EMPTY_SESSIONS);

  const completedIds = React.useMemo(
    () => new Set(sessions.filter((s) => s.status === "completed").map((s) => s.studentId)),
    [sessions],
  );
  const ordered = React.useMemo(
    () => [...students].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [students],
  );

  return (
    <>
      <PageHeader
        title="Suplementação"
        description="Suplementos aparecem somente quando agregam valor — sempre depois da alimentação."
      />

      {ordered.length === 0 ? (
        <EmptyState
          icon={<UsersIcon />}
          title="Nenhum aluno para avaliar"
          description="Cadastre um aluno e conclua o diagnóstico para avaliar a suplementação."
          action={
            <Button asChild>
              <Link href="/students">Ir para Alunos</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ordered.map((student) => {
            const ready = completedIds.has(student.id);
            return (
              <Card key={student.id} className="gap-3 py-4">
                <CardContent className="flex items-center gap-3 px-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <PillIcon className="size-5" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">{student.fullName}</span>
                    {student.mainGoal ? (
                      <Badge variant="secondary" className="w-fit text-[10px]">
                        {STUDENT_GOAL_LABELS[student.mainGoal]}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sem objetivo definido</span>
                    )}
                  </div>
                  {ready ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/supplements/${student.id}`}>
                        Avaliar
                        <ArrowRightIcon className="size-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/diagnosis/${student.id}`}>
                        <StethoscopeIcon className="size-4" />
                        Diagnóstico
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
