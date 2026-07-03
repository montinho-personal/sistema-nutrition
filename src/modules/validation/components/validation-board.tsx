"use client";

import * as React from "react";
import { AlertTriangleIcon, CheckCircle2Icon, CircleDashedIcon, LockIcon, ShieldCheckIcon } from "lucide-react";

import { Card, CardContent } from "@/shared/components/ui/card";
import { EmptyState } from "@/shared/components/empty-state";
import { SectionHeader } from "@/shared/components/section-header";
import { curatedFoods } from "@/modules/foods/data/curatedFoods";
import { useStudentPlan } from "@/modules/meal-plan/hooks/use-student-plan";
import { auditStrategy } from "@/modules/validation/services";
import { AUDIT_GROUP_LABELS, AUDIT_GROUP_ORDER } from "@/modules/validation/constants";
import type { AuditCheck, AuditStatus } from "@/modules/validation/types";

function StatusIcon({ status }: { status: AuditStatus }) {
  if (status === "ok") return <CheckCircle2Icon className="size-4 text-success" />;
  if (status === "attention") return <AlertTriangleIcon className="size-4 text-warning" />;
  return <CircleDashedIcon className="size-4 text-muted-foreground" />;
}

function CheckRow({ check }: { check: AuditCheck }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5 shrink-0">
        <StatusIcon status={check.status} />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-medium">{check.label}</span>
        <span className="text-xs text-muted-foreground">{check.detail}</span>
      </div>
    </div>
  );
}

/**
 * Validação da Estratégia (Workflow V1 — Etapa 6): auditoria automática antes do
 * documento. Orienta, nunca bloqueia — a etapa segue mesmo com pontos de atenção.
 */
export function ValidationBoard({ studentId }: { studentId: string }) {
  const { student, input, strategy, macros, scores, plan, mealsPerDay } =
    useStudentPlan(studentId);

  const report = React.useMemo(() => {
    if (!student?.mainGoal || !strategy || !macros || !scores || !plan || !input || !mealsPerDay) {
      return null;
    }
    return auditStrategy({
      calories: macros.calories,
      proteinG: macros.proteinG,
      tdee: macros.tdee,
      direction: strategy.direction,
      weightKg: input.currentWeightKg,
      plan,
      foods: curatedFoods,
      scores,
      mealsPerDay,
    });
  }, [student, strategy, macros, scores, plan, input, mealsPerDay]);

  if (!report) {
    return (
      <EmptyState
        icon={<LockIcon />}
        title="Conclua as etapas anteriores"
        description="Monte a estratégia e o cardápio para rodar a auditoria da validação."
      />
    );
  }

  const { checks, summary } = report;

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        title="Validação da estratégia"
        description="Auditoria automática antes de entregar — orienta, nunca impede continuar."
      />

      {/* Resumo */}
      <Card className="border-l-2 border-l-gold">
        <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-6">
          <span className="flex items-center gap-2 text-sm">
            <ShieldCheckIcon className="size-4 text-gold" />
            <strong className="tabular-nums">{summary.ok}</strong> em ordem
          </span>
          <span className="flex items-center gap-2 text-sm">
            <AlertTriangleIcon className="size-4 text-warning" />
            <strong className="tabular-nums">{summary.attention}</strong> a ajustar
          </span>
          <span className="flex items-center gap-2 text-sm">
            <CircleDashedIcon className="size-4 text-muted-foreground" />
            <strong className="tabular-nums">{summary.review}</strong> a revisar
          </span>
          <span className="ml-auto text-xs text-muted-foreground">
            Você pode seguir para o documento mesmo assim.
          </span>
        </CardContent>
      </Card>

      {/* Grupos */}
      {AUDIT_GROUP_ORDER.map((group) => {
        const groupChecks = checks.filter((c) => c.group === group);
        if (groupChecks.length === 0) return null;
        return (
          <div key={group} className="flex flex-col gap-1.5">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {AUDIT_GROUP_LABELS[group]}
            </span>
            <Card>
              <CardContent className="divide-y pt-2 pb-2">
                {groupChecks.map((c) => (
                  <CheckRow key={c.id} check={c} />
                ))}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
