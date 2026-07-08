"use client";

import { Badge } from "@/shared/components/ui/badge";
import { DIRECTION_LABELS } from "@/modules/strategy/constants/parameters";
import type { ReportModel } from "@/modules/reports/types";

/** 92,0 — decimal pt-BR. */
const br1 = (value: number) => value.toFixed(1).replace(".", ",");

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

interface CoverStat {
  label: string;
  value: string;
  sub: string;
}

/**
 * A meta em uma linha ("−6,0 kg · em 12 semanas"); sem meta definida, o ponto
 * de partida assume o lugar — a capa nunca fica com um número vazio.
 */
function goalStat(report: ReportModel): CoverStat {
  const { meta, strategy } = report;
  if (meta.targetChangeKg && strategy.direction !== "manutencao") {
    const sign = strategy.direction === "deficit" ? "−" : "+";
    return {
      label: "Meta",
      value: `${sign}${br1(meta.targetChangeKg)} kg`,
      sub: meta.targetWeeks ? `em ${meta.targetWeeks} semanas` : "meta definida",
    };
  }
  return {
    label: "Peso inicial",
    value: `${br1(meta.startWeightKg)} kg`,
    sub: meta.bodyFatPct ? `${meta.bodyFatPct}% de gordura` : "ponto de partida",
  };
}

/**
 * Capa premium do Relatório (Documento 02 — padrão de consultoria). Na
 * impressão ocupa a página 1 inteira; na tela abre o documento como um hero.
 * Tudo na capa é informação individual — nada decorativo: quem é o aluno, a
 * meta, os números do plano e a promessa de justificativa.
 */
export function ReportCover({ report }: { report: ReportModel }) {
  const { meta, strategy, macros, mealPlan } = report;

  const stats: CoverStat[] = [
    goalStat(report),
    { label: "Calorias-alvo", value: `${macros.calories}`, sub: "kcal por dia" },
    { label: "Proteína", value: `${macros.proteinG} g`, sub: "por dia" },
    { label: "Refeições", value: `${mealPlan.meals.length}`, sub: "por dia" },
  ];

  return (
    <section className="flex flex-col justify-between gap-10 rounded-xl border bg-card p-8 sm:p-10 print:min-h-[92vh] print:break-after-page print:rounded-none print:border-0 print:p-2">
      {/* Marca */}
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-gold text-sm font-bold text-gold-foreground">
          M
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-[0.18em] uppercase">
            Montinho Nutrition Strategy
          </span>
          <span className="text-xs text-muted-foreground">
            Relatório estratégico individual
          </span>
        </div>
      </div>

      {/* Identidade — o documento pertence a uma pessoa, não a um modelo. */}
      <div className="flex flex-col gap-4 py-4 print:py-10">
        <span className="text-xs font-medium tracking-[0.25em] text-gold uppercase">
          Preparado exclusivamente para
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {meta.studentName}
        </h1>
        <span className="h-0.5 w-16 rounded-full bg-gold" aria-hidden />
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {meta.goalLabel ? <Badge variant="secondary">{meta.goalLabel}</Badge> : null}
          <Badge variant="outline">{DIRECTION_LABELS[strategy.direction]}</Badge>
          {meta.ageYears ? <span>{meta.ageYears} anos</span> : null}
          <span>· Peso inicial {br1(meta.startWeightKg)} kg</span>
          {meta.bodyFatPct ? <span>· {meta.bodyFatPct}% de gordura</span> : null}
        </div>
      </div>

      {/* O plano em números */}
      <div className="flex flex-col gap-4">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          O seu plano em números
        </span>
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-0.5 border-l-2 border-gold/60 pl-3">
              <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                {s.label}
              </span>
              <span className="text-2xl font-semibold tracking-tight tabular-nums">{s.value}</span>
              <span className="text-xs text-muted-foreground">{s.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* A promessa do documento (Documento 02 — decisões sempre justificadas). */}
      <p className="max-w-xl text-sm text-muted-foreground italic">
        “Este plano foi desenhado para a sua rotina — não o contrário. Cada número e cada decisão
        das próximas páginas têm uma justificativa.”
      </p>

      {/* Rodapé da capa */}
      <div className="flex flex-wrap items-end justify-between gap-2 border-t pt-4 text-xs text-muted-foreground">
        <span>
          Preparado por <strong className="font-semibold text-foreground">Montinho Personal</strong>
        </span>
        <span>
          Gerado em {formatDate(meta.generatedAt)} · Confiança do diagnóstico {meta.confidence}%
        </span>
      </div>
    </section>
  );
}
