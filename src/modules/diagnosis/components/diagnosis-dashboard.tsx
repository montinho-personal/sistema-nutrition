"use client";

import * as React from "react";
import {
  BeefIcon,
  DropletsIcon,
  FlameIcon,
  ScaleIcon,
  TargetIcon,
  WheatIcon,
} from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import { SectionHeader } from "@/shared/components/section-header";
import {
  ageFromBirthDate,
  buildDiagnosisDashboard,
  computeScoreMap,
  readTrainingContext,
} from "@/modules/diagnosis/services";
import { computeEnergyBreakdown } from "@/modules/strategy/services";
import { useStrategyInput } from "@/modules/strategy/hooks/use-strategy-input";
import type { DifficultyLevel } from "@/modules/diagnosis/services";
import type { AnswerMap } from "@/modules/diagnosis/types";
import type { MacroContext } from "@/modules/strategy/types";
import type { Student } from "@/modules/students/types";

const DIFFICULTY_BADGE: Record<
  DifficultyLevel,
  { label: string; variant: "success" | "warning" | "destructive" }
> = {
  baixo: { label: "Dificuldade baixa", variant: "success" },
  medio: { label: "Dificuldade média", variant: "warning" },
  alto: { label: "Dificuldade alta", variant: "destructive" },
};

/** Um número de referência do diagnóstico (IMC, consumo, proteína…). */
function RefCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="gap-0 py-4">
      <CardContent className="flex flex-col gap-1 px-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </span>
          <span className="text-muted-foreground [&>svg]:size-4">{icon}</span>
        </div>
        <span className="text-xl font-semibold tabular-nums">{value}</span>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </CardContent>
    </Card>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it) => (
        <span
          key={it}
          className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground"
        >
          {it}
        </span>
      ))}
    </div>
  );
}

/**
 * Dashboard Executivo do Diagnóstico (Workflow V1 — Etapa 2): objetivos, grau de
 * dificuldade, IMC, estimativas/referências nutricionais e o parecer profissional.
 * Tudo determinístico (Doc 08). Números que dependem do peso só aparecem quando
 * ele já foi informado (o painel de Gasto energético pede o peso logo abaixo).
 */
export function DiagnosisDashboard({ student, answers }: { student: Student; answers: AnswerMap }) {
  const { input } = useStrategyInput(student.id);
  const weightKg = input?.currentWeightKg ?? null;

  const scores = React.useMemo(() => computeScoreMap(answers), [answers]);
  const tdee = React.useMemo(() => {
    if (!weightKg) return null;
    const ctx: MacroContext = {
      weightKg,
      bodyFatPct: input?.bodyFatPct ?? null,
      heightCm: student.heightCm,
      ageYears: ageFromBirthDate(student.birthDate),
      sex: student.sex,
      activity: (answers.activity as string | undefined) ?? null,
      trains: (answers.trains as string | undefined) ?? null,
      ...readTrainingContext(answers),
    };
    return computeEnergyBreakdown(ctx).tdee;
  }, [weightKg, input, student, answers]);

  const dash = React.useMemo(
    () =>
      buildDiagnosisDashboard({
        answers,
        scores,
        goal: student.mainGoal,
        ageYears: ageFromBirthDate(student.birthDate),
        weightKg,
        heightCm: student.heightCm,
        tdee,
      }),
    [answers, scores, student, weightKg, tdee],
  );

  const badge = DIFFICULTY_BADGE[dash.difficulty.level];

  return (
    <div className="flex flex-col gap-6">
      {/* Parecer + objetivos + dificuldade */}
      <section className="flex flex-col gap-3">
        <SectionHeader
          title="Dashboard do diagnóstico"
          description="A leitura do caso — objetivos, dificuldade e o parecer profissional."
        />
        <Card className="border-l-2 border-l-gold">
          <CardContent className="flex flex-col gap-4 pt-6">
            <div className="flex flex-wrap items-center gap-2">
              {dash.objectives.main ? (
                <Badge variant="secondary">
                  <TargetIcon className="size-3" />
                  {dash.objectives.main}
                </Badge>
              ) : null}
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </div>

            {dash.objectives.secondary.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Objetivos secundários
                </span>
                <Chips items={dash.objectives.secondary} />
              </div>
            ) : null}

            <p className="text-sm leading-relaxed">{dash.parecer}</p>

            {dash.strengths.length > 0 || dash.weaknesses.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 border-t pt-3 sm:grid-cols-2">
                {dash.strengths.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium tracking-wide text-success uppercase">
                      Pontos fortes
                    </span>
                    <Chips items={dash.strengths} />
                  </div>
                ) : null}
                {dash.weaknesses.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium tracking-wide text-warning uppercase">
                      Pontos de atenção
                    </span>
                    <Chips items={dash.weaknesses} />
                  </div>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      {/* Antropometria e referências (dependem do peso) */}
      {weightKg ? (
        <section className="flex flex-col gap-3">
          <SectionHeader
            title="Antropometria e referências"
            description="Números-base do caso — o consumo atual é estimado pela manutenção."
          />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
            {dash.imc ? (
              <RefCard
                label="IMC"
                value={dash.imc.value.toLocaleString("pt-BR")}
                hint={dash.imc.label}
                icon={<ScaleIcon />}
              />
            ) : null}
            <RefCard
              label="Consumo atual"
              value={dash.estimates.currentIntakeKcal ? `${dash.estimates.currentIntakeKcal} kcal` : "—"}
              hint="estimado (manutenção)"
              icon={<FlameIcon />}
            />
            <RefCard
              label="Proteína"
              value={dash.estimates.proteinG ? `${dash.estimates.proteinG} g` : "—"}
              hint={dash.estimates.proteinPerKg ? `alvo ${dash.estimates.proteinPerKg} g/kg` : undefined}
              icon={<BeefIcon />}
            />
            <RefCard
              label="Fibras"
              value={dash.estimates.fiberG ? `${dash.estimates.fiberG} g` : "—"}
              hint="recomendado/dia"
              icon={<WheatIcon />}
            />
            <RefCard
              label="Água"
              value={
                dash.estimates.recommendedWaterMl
                  ? `${(dash.estimates.recommendedWaterMl / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} L`
                  : "—"
              }
              hint={
                dash.estimates.currentWaterL
                  ? `hoje ~${dash.estimates.currentWaterL.toLocaleString("pt-BR")} L · recomendado`
                  : "recomendado/dia"
              }
              icon={<DropletsIcon />}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
