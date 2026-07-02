"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRightIcon, MapIcon, UsersIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";
import { useLocalCollection } from "@/shared/hooks/use-local-collection";
import { STUDENT_GOAL_LABELS } from "@/modules/students/constants";
import type { Student } from "@/modules/students/types";

const EMPTY_STUDENTS: Student[] = [];

/**
 * Índice do Roadmap: a jornada existe para qualquer aluno cadastrado — mesmo
 * antes do diagnóstico, o caminho já pode ser mostrado.
 */
export function RoadmapIndex() {
  const students = useLocalCollection<Student[]>("students", EMPTY_STUDENTS);
  const ordered = React.useMemo(
    () => [...students].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [students],
  );

  return (
    <>
      <PageHeader
        title="Roadmap"
        description="A jornada completa da transformação — o sistema entrega um caminho, não uma dieta."
      />

      {ordered.length === 0 ? (
        <EmptyState
          icon={<UsersIcon />}
          title="Nenhum aluno para traçar a jornada"
          description="Cadastre um aluno para visualizar o roadmap da transformação."
          action={
            <Button asChild>
              <Link href="/students">Ir para Alunos</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ordered.map((student) => (
            <Card key={student.id} className="gap-3 py-4">
              <CardContent className="flex items-center gap-3 px-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <MapIcon className="size-5" />
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
                <Button asChild variant="outline" size="sm">
                  <Link href={`/roadmap/${student.id}`}>
                    Ver jornada
                    <ArrowRightIcon className="size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
