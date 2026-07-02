"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRightIcon, CalendarCheckIcon, TargetIcon, UsersIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";
import { useLocalCollection } from "@/shared/hooks/use-local-collection";
import { STUDENT_GOAL_LABELS } from "@/modules/students/constants";
import type { Student } from "@/modules/students/types";
import type { StrategyRecord } from "@/modules/strategy/types";

const EMPTY_STUDENTS: Student[] = [];
const EMPTY_RECORDS: StrategyRecord[] = [];

/**
 * Índice dos Acompanhamentos: exige estratégia (baseline). Sinaliza quem já
 * pode ser acompanhado.
 */
export function FollowUpsIndex() {
  const students = useLocalCollection<Student[]>("students", EMPTY_STUDENTS);
  const records = useLocalCollection<StrategyRecord[]>("strategy_records", EMPTY_RECORDS);

  const withStrategy = React.useMemo(
    () => new Set(records.map((r) => r.studentId)),
    [records],
  );
  const ordered = React.useMemo(
    () => [...students].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [students],
  );

  return (
    <>
      <PageHeader
        title="Acompanhamentos"
        description="Monitoramento contínuo: adesão, fome, sono, energia e evolução."
      />

      {ordered.length === 0 ? (
        <EmptyState
          icon={<UsersIcon />}
          title="Nenhum aluno para acompanhar ainda"
          description="Cadastre um aluno, conclua o diagnóstico e gere a estratégia para começar a acompanhar."
          action={
            <Button asChild>
              <Link href="/students">Ir para Alunos</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ordered.map((student) => {
            const ready = withStrategy.has(student.id) && Boolean(student.mainGoal);
            return (
              <Card key={student.id} className="gap-3 py-4">
                <CardContent className="flex items-center gap-3 px-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <CalendarCheckIcon className="size-5" />
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
                      <Link href={`/follow-ups/${student.id}`}>
                        Acompanhar
                        <ArrowRightIcon className="size-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/strategy/${student.id}`}>
                        <TargetIcon className="size-4" />
                        Estratégia
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
