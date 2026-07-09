"use client";

import * as React from "react";
import { ActivityIcon, DumbbellIcon, FlameIcon, GaugeIcon, ScaleIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { SectionHeader } from "@/shared/components/section-header";
import { computeEnergyBreakdown } from "@/modules/strategy/services";
import { useStrategyInput } from "@/modules/strategy/hooks/use-strategy-input";
import { readTrainingContext, resolveAgeYears, resolveHeightCm } from "@/modules/diagnosis/services";
import type { AnswerMap } from "@/modules/diagnosis/types";
import type { EnergyBreakdown, MacroContext, StrategyInput } from "@/modules/strategy/types";
import type { Student } from "@/modules/students/types";

const METHOD_LABEL: Record<EnergyBreakdown["bmrMethod"], string> = {
  katch_mcardle: "Katch-McArdle (usa a massa magra)",
  mifflin: "Mifflin-St Jeor (peso, altura, idade e sexo)",
  fallback: "estimativa por peso (faltam altura, idade ou sexo)",
};

/** Um número do gasto energético, com a fração do total. */
function EnergyStat({
  label,
  kcal,
  total,
  icon,
  accent,
}: {
  label: string;
  kcal: number;
  total: number;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  const pct = total > 0 ? Math.round((kcal / total) * 100) : 0;
  return (
    <Card className={cn("gap-0 py-4", accent && "border-l-2 border-l-gold")}>
      <CardContent className="flex flex-col gap-1.5 px-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </span>
          <span className={cn("[&>svg]:size-4", accent ? "text-gold" : "text-muted-foreground")}>
            {icon}
          </span>
        </div>
        <span className="text-2xl font-semibold tabular-nums">
          {kcal.toLocaleString("pt-BR")} <span className="text-sm font-normal">kcal</span>
        </span>
        <span className="text-xs text-muted-foreground">{pct}% do total</span>
      </CardContent>
    </Card>
  );
}

/** Barra empilhada: proporção de cada parcela no gasto total. */
function EnergyBar({ energy }: { energy: EnergyBreakdown }) {
  const total = energy.tdee || 1;
  const segments = [
    { label: "Metabolismo basal", kcal: energy.bmr, className: "bg-gold" },
    { label: "Atividades do dia a dia", kcal: energy.dailyActivityKcal, className: "bg-foreground/70" },
    { label: "Treino", kcal: energy.trainingKcal, className: "bg-muted-foreground/50" },
  ];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full">
        {segments.map((s) => (
          <div
            key={s.label}
            className={s.className}
            style={{ width: `${(s.kcal / total) * 100}%` }}
            aria-label={`${s.label}: ${Math.round((s.kcal / total) * 100)}%`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {segments.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className={`inline-block size-2 rounded-full ${s.className}`} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Gasto energético do aluno (Documento 04): metabolismo basal + treino + demais
 * atividades = total (TDEE). Precisa do peso — quando ainda não há, o treinador
 * informa aqui mesmo (reaproveitado pela Estratégia).
 */
export function EnergyExpenditure({ student, answers }: { student: Student; answers: AnswerMap }) {
  const { input, save } = useStrategyInput(student.id);
  const [draft, setDraft] = React.useState("");

  const weightKg = input?.currentWeightKg ?? null;

  const saveWeight = () => {
    const value = Number(draft.replace(",", "."));
    if (!Number.isFinite(value) || value < 30 || value > 300) return;
    const base: StrategyInput = input ?? { currentWeightKg: value, bodyFatPct: null };
    save({ ...base, currentWeightKg: value });
  };

  const header = (
    <SectionHeader
      title="Gasto energético"
      description="Quanto o corpo gasta por dia — a base das calorias da estratégia."
    />
  );

  if (!weightKg) {
    return (
      <section className="flex flex-col gap-3">
        {header}
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <div className="flex items-start gap-3">
              <ScaleIcon className="mt-0.5 size-5 shrink-0 text-gold" />
              <p className="text-sm text-muted-foreground">
                Informe o peso atual do aluno para estimar o metabolismo basal, o gasto no treino e
                nas demais atividades — e o total.
              </p>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="energy-weight" className="text-xs font-medium">
                  Peso atual (kg)
                </label>
                <Input
                  id="energy-weight"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  placeholder="Ex.: 82"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveWeight()}
                  className="h-9 w-32"
                />
              </div>
              <Button variant="gold" onClick={saveWeight} className="h-9">
                Calcular
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  const ctx: MacroContext = {
    weightKg,
    bodyFatPct: input?.bodyFatPct ?? null,
    heightCm: resolveHeightCm(student, answers),
    ageYears: resolveAgeYears(student, answers),
    sex: student.sex,
    activity: (answers.activity as string | undefined) ?? null,
    trains: (answers.trains as string | undefined) ?? null,
    ...readTrainingContext(answers),
  };
  const energy = computeEnergyBreakdown(ctx);

  return (
    <section className="flex flex-col gap-3">
      {header}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <EnergyStat
          label="Metabolismo basal"
          kcal={energy.bmr}
          total={energy.tdee}
          icon={<FlameIcon />}
        />
        <EnergyStat
          label="Gasto no treino"
          kcal={energy.trainingKcal}
          total={energy.tdee}
          icon={<DumbbellIcon />}
        />
        <EnergyStat
          label="Atividades do dia a dia"
          kcal={energy.dailyActivityKcal}
          total={energy.tdee}
          icon={<ActivityIcon />}
        />
        <EnergyStat
          label="Gasto total (TDEE)"
          kcal={energy.tdee}
          total={energy.tdee}
          icon={<GaugeIcon />}
          accent
        />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <EnergyBar energy={energy} />
          <p className="border-t pt-3 text-xs text-muted-foreground">
            Metabolismo basal por {METHOD_LABEL[energy.bmrMethod]}. Fator de atividade{" "}
            <strong className="text-foreground">{energy.activityFactor.toFixed(3)}</strong> — peso de{" "}
            <strong className="text-foreground">{weightKg} kg</strong>. Estimativa determinística; o
            gasto real varia com o dia.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
