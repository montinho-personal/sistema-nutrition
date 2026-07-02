"use client";

import * as React from "react";
import { RotateCcwIcon, SaveIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { PageHeader } from "@/shared/components/page-header";
import { SectionHeader } from "@/shared/components/section-header";
import { STUDENT_GOAL_LABELS } from "@/modules/students/constants";
import { VELOCITY_LABELS, DEFAULT_MACRO_PARAMS } from "@/modules/strategy/constants/parameters";
import type { StudentGoal } from "@/modules/students/types";
import type { MacroParams, StrategyVelocity } from "@/modules/strategy/types";
import { useMacroParams } from "@/modules/settings/hooks/use-macro-params";
import { saveMacroParams, resetMacroParams } from "@/modules/settings/services";

const GOALS = Object.keys(STUDENT_GOAL_LABELS) as StudentGoal[];
const VELOCITIES = Object.keys(VELOCITY_LABELS) as StrategyVelocity[];

function NumberRow({
  label,
  value,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="text-sm font-normal">{label}</Label>
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          step={step}
          value={Number.isNaN(value) ? "" : value}
          onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
          className="h-8 w-24 text-right tabular-nums"
        />
        <span className="w-10 text-xs text-muted-foreground">{suffix}</span>
      </div>
    </div>
  );
}

/** Configurações — parâmetros estratégicos configuráveis (Documento 08). */
export function SettingsView() {
  const current = useMacroParams();
  // Estado local editável, semeado com os parâmetros atuais.
  const [draft, setDraft] = React.useState<MacroParams>(current);
  const [seededFor, setSeededFor] = React.useState(current);

  // Re-semear quando os parâmetros efetivos mudarem (ex.: após restaurar).
  if (seededFor !== current) {
    setDraft(current);
    setSeededFor(current);
  }

  const setProtein = (goal: StudentGoal, v: number) =>
    setDraft((d) => ({ ...d, proteinGPerKg: { ...d.proteinGPerKg, [goal]: v } }));
  const setDeficit = (vel: StrategyVelocity, v: number) =>
    setDraft((d) => ({ ...d, velocityDeficitPct: { ...d.velocityDeficitPct, [vel]: v / 100 } }));
  const setSurplus = (vel: StrategyVelocity, v: number) =>
    setDraft((d) => ({ ...d, velocitySurplusPct: { ...d.velocitySurplusPct, [vel]: v / 100 } }));

  const handleSave = () => {
    saveMacroParams(draft);
    toast.success("Parâmetros salvos. Os cálculos de macro já usam os novos valores.");
  };
  const handleReset = () => {
    resetMacroParams();
    setDraft(DEFAULT_MACRO_PARAMS);
    setSeededFor(DEFAULT_MACRO_PARAMS);
    toast.success("Parâmetros restaurados para o padrão.");
  };

  return (
    <>
      <PageHeader
        title="Configurações"
        description="Parâmetros estratégicos do sistema — nenhum cálculo com valores fixos no código."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcwIcon className="size-4" />
              Restaurar padrões
            </Button>
            <Button size="sm" onClick={handleSave}>
              <SaveIcon className="size-4" />
              Salvar
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-6">
        <SectionHeader
          title="Parâmetros de macro"
          description="Ajuste a matemática dos macros. Os motores passam a usar estes valores imediatamente."
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Proteína por objetivo (g/kg)</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {GOALS.map((goal) => (
                <NumberRow
                  key={goal}
                  label={STUDENT_GOAL_LABELS[goal]}
                  value={draft.proteinGPerKg[goal]}
                  step={0.1}
                  suffix="g/kg"
                  onChange={(v) => setProtein(goal, v)}
                />
              ))}
              <div className="border-t pt-3">
                <NumberRow
                  label="Gordura mínima"
                  value={draft.fatGPerKg}
                  step={0.1}
                  suffix="g/kg"
                  onChange={(v) => setDraft((d) => ({ ...d, fatGPerKg: v }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ajuste calórico por velocidade (%)</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Déficit (emagrecimento)
                </span>
                {VELOCITIES.map((vel) => (
                  <NumberRow
                    key={vel}
                    label={VELOCITY_LABELS[vel]}
                    value={Math.round(draft.velocityDeficitPct[vel] * 100)}
                    step={1}
                    suffix="%"
                    onChange={(v) => setDeficit(vel, v)}
                  />
                ))}
              </div>
              <div className="flex flex-col gap-3 border-t pt-3">
                <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Superávit (hipertrofia)
                </span>
                {VELOCITIES.map((vel) => (
                  <NumberRow
                    key={vel}
                    label={VELOCITY_LABELS[vel]}
                    value={Math.round(draft.velocitySurplusPct[vel] * 100)}
                    step={1}
                    suffix="%"
                    onChange={(v) => setSurplus(vel, v)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-muted-foreground">
          Os fatores de atividade, os coeficientes de BMR e a energia por grama seguem padrões
          consolidados e não são editáveis aqui.
        </p>
      </div>
    </>
  );
}
