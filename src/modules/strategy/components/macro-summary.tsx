"use client";

import { FlameIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Card, CardContent } from "@/shared/components/ui/card";
import { MetricCard } from "@/shared/components/metric-card";
import { SectionHeader } from "@/shared/components/section-header";
import { KCAL_PER_GRAM } from "@/modules/strategy/constants/parameters";
import type { AlertLevel, StrategyAlert } from "@/modules/strategy/services";
import type { MacroTargets } from "@/modules/strategy/types";

const ALERT_EMOJI: Record<AlertLevel, string> = {
  green: "🟢",
  yellow: "🟡",
  orange: "🟠",
  red: "🔴",
};

/** Painel de alertas inteligentes (🟢🟡🟠🔴) — orienta, nunca bloqueia. */
function StrategyAlerts({ alerts }: { alerts: StrategyAlert[] }) {
  if (alerts.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {alerts.map((a) => (
        <div
          key={a.title}
          className={cn(
            "flex items-start gap-2.5 rounded-lg border px-3 py-2.5",
            a.level === "green" && "border-success/30 bg-success/5",
            a.level === "yellow" && "border-warning/30 bg-warning/5",
            a.level === "orange" && "border-warning/40 bg-warning/10",
            a.level === "red" && "border-danger/40 bg-danger/5",
          )}
        >
          <span className="text-sm leading-none">{ALERT_EMOJI[a.level]}</span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-medium">{a.title}</span>
            <span className="text-xs text-muted-foreground">{a.detail}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Barra de proporção dos macros nas calorias totais. */
function MacroBar({ macros }: { macros: MacroTargets }) {
  const total = macros.proteinKcal + macros.fatKcal + macros.carbKcal || 1;
  const segments = [
    { label: "Proteína", kcal: macros.proteinKcal, className: "bg-gold" },
    { label: "Carboidrato", kcal: macros.carbKcal, className: "bg-foreground/70" },
    { label: "Gordura", kcal: macros.fatKcal, className: "bg-muted-foreground/50" },
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
            {s.label} {Math.round((s.kcal / total) * 100)}%
          </span>
        ))}
      </div>
    </div>
  );
}

/** Resumo dos macros: calorias-alvo, gramas, alertas e as justificativas do cálculo. */
export function MacroSummary({
  macros,
  alerts = [],
}: {
  macros: MacroTargets;
  alerts?: StrategyAlert[];
}) {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="Macros"
        description="A matemática vem depois da estratégia — e cada número tem justificativa."
      />

      <StrategyAlerts alerts={alerts} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Calorias-alvo"
          value={`${macros.calories} kcal`}
          icon={<FlameIcon />}
        />
        <MetricCard label="Proteína" value={`${macros.proteinG} g`} />
        <MetricCard label="Carboidrato" value={`${macros.carbG} g`} />
        <MetricCard label="Gordura" value={`${macros.fatG} g`} />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <MacroBar macros={macros} />
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
            <span>
              BMR <strong className="text-foreground">{macros.bmr}</strong> kcal
            </span>
            <span>
              TDEE <strong className="text-foreground">{macros.tdee}</strong> kcal
            </span>
            <span>
              Fator de atividade{" "}
              <strong className="text-foreground">{macros.activityFactor.toFixed(3)}</strong>
            </span>
            <span>
              {KCAL_PER_GRAM.protein}/{KCAL_PER_GRAM.carb}/{KCAL_PER_GRAM.fat} kcal por g (P/C/G)
            </span>
          </div>
          <ul className="flex flex-col gap-1.5 border-t pt-3 text-sm text-muted-foreground">
            {macros.justifications.map((j) => (
              <li key={j} className="flex items-start gap-2">
                <span className="mt-1.5 inline-block size-1 shrink-0 rounded-full bg-gold" />
                {j}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
