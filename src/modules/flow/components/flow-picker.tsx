"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRightIcon, UserPlusIcon, UsersIcon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { PageHeader } from "@/shared/components/page-header";
import { EmptyState } from "@/shared/components/empty-state";
import { LoadingScreen } from "@/shared/components/loading-screen";
import { useLocalCollection } from "@/shared/hooks/use-local-collection";
import { STUDENT_GOAL_LABELS } from "@/modules/students/constants";
import type { Student } from "@/modules/students/types";

const EMPTY: Student[] = [];

/** Escolha do aluno para iniciar o fluxo (Workflow V1). */
export function FlowPicker() {
  const students = useLocalCollection<Student[]>("students", EMPTY);

  if (typeof window === "undefined") {
    return <LoadingScreen messages={["Carregando alunos..."]} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Montar estratégia"
        description="Escolha o aluno para começar o fluxo — da anamnese ao documento final."
      />

      {students.length === 0 ? (
        <EmptyState
          icon={<UsersIcon />}
          title="Nenhum aluno ainda"
          description="Cadastre um aluno para iniciar o fluxo de estratégia nutricional."
          action={
            <Button asChild>
              <Link href="/students">
                <UserPlusIcon className="size-4" />
                Cadastrar aluno
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => (
            <Link key={student.id} href={`/flow/${student.id}`} className="group">
              <Card className="transition-colors group-hover:border-gold">
                <CardContent className="flex items-center justify-between gap-3 pt-6">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{student.fullName}</span>
                    <span className="text-sm text-muted-foreground">
                      {student.mainGoal
                        ? STUDENT_GOAL_LABELS[student.mainGoal]
                        : "Objetivo não definido"}
                    </span>
                  </div>
                  <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-gold" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
