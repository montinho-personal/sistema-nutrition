"use client";

import * as React from "react";
import {
  AlertTriangleIcon,
  FlameIcon,
  InfoIcon,
  TargetIcon,
  UserIcon,
} from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/components/ui/badge";
import { ageFromBirthDate } from "@/modules/diagnosis/services";
import { STUDENT_GOAL_LABELS } from "@/modules/students/constants";
import {
  DIRECTION_LABELS,
  PHILOSOPHY_LABELS,
  VELOCITY_LABELS,
} from "@/modules/strategy/constants/parameters";
import { useStrategyInput } from "@/modules/strategy/hooks/use-strategy-input";
import type { FlowData } from "@/modules/flow/hooks/use-flow-data";

function RailBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

/**
 * Strategy Rail: o resumo do aluno e da estratégia sempre à vista — aluno,
 * estratégia escolhida, calorias, macros, objetivo e alertas. Nunca é preciso
 * trocar de tela para consultar (Workflow V1 — camada transversal).
 */
export function StrategyRail({ data, studentId }: { data: FlowData; studentId: string }) {
  const { input } = useStrategyInput(studentId);
  const { student, strategy, macros, alerts } = data;
  if (!student) return null;

  const age = ageFromBirthDate(student.birthDate);
  const bodyBits = [
    input?.currentWeightKg ? `${input.currentWeightKg} kg` : null,
    age ? `${age} anos` : null,
    student.heightCm ? `${student.heightCm} cm` : null,
  ].filter(Boolean);

  return (
    <aside className="flex flex-col gap-5 rounded-xl border bg-card p-4">
      {/* Aluno */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-gold/10 text-gold ring-1 ring-gold/20">
            <UserIcon className="size-4" />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold">{student.fullName}</span>
            {bodyBits.length > 0 ? (
              <span className="text-xs text-muted-foreground">{bodyBits.join(" · ")}</span>
            ) : null}
          </div>
        </div>
        {student.mainGoal ? (
          <Badge variant="secondary" className="w-fit">
            <TargetIcon className="size-3" />
            {STUDENT_GOAL_LABELS[student.mainGoal]}
          </Badge>
        ) : null}
      </div>

      {/* Estratégia */}
      {strategy ? (
        <RailBlock label="Estratégia">
          <div className="flex flex-col gap-1.5">
            <Line label="Velocidade" value={VELOCITY_LABELS[strategy.velocity]} />
            <Line label="Direção" value={DIRECTION_LABELS[strategy.direction]} />
            <Line label="Filosofia" value={PHILOSOPHY_LABELS[strategy.philosophy]} />
            <Line label="Refeições/dia" value={String(strategy.mealsPerDay)} />
          </div>
        </RailBlock>
      ) : null}

      {/* Macros */}
      {macros ? (
        <RailBlock label="Macros">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <FlameIcon className="size-4 text-gold" />
              <span className="text-xl font-semibold tabular-nums">
                {macros.calories.toLocaleString("pt-BR")}
              </span>
              <span className="text-xs text-muted-foreground">kcal</span>
              {macros.manual ? (
                <Badge className="ml-auto bg-gold text-gold-foreground hover:bg-gold">manual</Badge>
              ) : null}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { k: "P", v: macros.proteinG },
                { k: "C", v: macros.carbG },
                { k: "G", v: macros.fatG },
              ].map((m) => (
                <div key={m.k} className="flex flex-col rounded-md bg-muted/50 px-2 py-1.5">
                  <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                    {m.k}
                  </span>
                  <span className="text-sm font-semibold tabular-nums">{m.v} g</span>
                </div>
              ))}
            </div>
          </div>
        </RailBlock>
      ) : null}

      {/* Alertas */}
      <RailBlock label="Alertas">
        {alerts.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum alerta — tudo em ordem por aqui.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {alerts.map((a) => (
              <li key={a.text} className="flex items-start gap-1.5 text-xs">
                {a.level === "high" ? (
                  <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0 text-danger" />
                ) : a.level === "warn" ? (
                  <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0 text-warning" />
                ) : (
                  <InfoIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                )}
                <span
                  className={cn(
                    a.level === "high" ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {a.text}
                </span>
              </li>
            ))}
          </ul>
        )}
      </RailBlock>
    </aside>
  );
}
