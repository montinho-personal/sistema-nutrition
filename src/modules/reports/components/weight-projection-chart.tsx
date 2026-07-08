"use client";

import { Card, CardContent } from "@/shared/components/ui/card";
import { WEIGHT_PROJECTION } from "@/modules/follow-ups/constants/parameters";
import type { ProjectionPace, WeightProjection } from "@/modules/follow-ups/services";

/** 92,0 — decimal pt-BR. */
const br1 = (v: number) => v.toFixed(1).replace(".", ",");
/** −0,50 — ritmo sinalizado pt-BR. */
const brRate = (v: number) => `${v < 0 ? "−" : "+"}${Math.abs(v).toFixed(2).replace(".", ",")}`;

/** Veredito do último registro — sempre com orientação (Documento 02). */
const PACE_VERDICT: Record<ProjectionPace, string> = {
  on_track: "dentro da faixa esperada — plano e realidade caminhando juntos",
  behind: "ritmo abaixo do previsto — revise a aderência ou ajuste as calorias na Estratégia",
  ahead: "ritmo acima do previsto — se houver fome ou queda de energia, suavize o ajuste calórico",
  drift: "fora da faixa de manutenção — vale revisar a rotina e as calorias",
};

/** Geometria do gráfico (viewBox — a largura real é fluida). */
const W = 748;
const H = 300;
const MARGIN = { top: 30, right: 118, bottom: 34, left: 44 };

interface Scales {
  x: (week: number) => number;
  y: (kg: number) => number;
}

function path(points: { week: number; kg: number }[], s: Scales): string {
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${s.x(p.week).toFixed(1)} ${s.y(p.kg).toFixed(1)}`)
    .join(" ");
}

/** Ticks "redondos" do eixo Y (passo 0,5/1/2/5 conforme a amplitude). */
function yTicks(min: number, max: number): number[] {
  const range = max - min;
  const step = [0.5, 1, 2, 5, 10].find((s) => range / s <= 5) ?? 10;
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max; v += step) ticks.push(v);
  return ticks;
}

/**
 * Projeção de peso — plano × realidade. A linha dourada é o plano (do peso
 * inicial à meta), a faixa é a margem esperada e os pontos em tinta são os
 * pesos registrados. Presentacional: toda a regra vive em `buildWeightProjection`.
 */
export function WeightProjectionChart({ projection }: { projection: WeightProjection }) {
  const p = projection;
  const hasActual = p.actual.length > 1;

  // Domínios: cobrem plano, faixa e registros, com respiro.
  const xMax = Math.max(p.weeks, Math.ceil(p.last?.week ?? 0));
  const allKg = [...p.upper, ...p.lower, ...p.actual].map((pt) => pt.kg);
  const pad = 0.6;
  const yMin = Math.min(...allKg) - pad;
  const yMax = Math.max(...allKg) + pad;

  const s: Scales = {
    x: (week) => MARGIN.left + (week / xMax) * (W - MARGIN.left - MARGIN.right),
    y: (kg) => MARGIN.top + ((yMax - kg) / (yMax - yMin)) * (H - MARGIN.top - MARGIN.bottom),
  };

  const weekStep = [1, 2, 3, 4, 8].find((st) => xMax / st <= 6) ?? 8;
  const weekTicks: number[] = [];
  for (let w = 0; w <= xMax; w += weekStep) weekTicks.push(w);

  const band = `${path(p.upper, s)} ${p.lower
    .slice()
    .reverse()
    .map((pt) => `L ${s.x(pt.week).toFixed(1)} ${s.y(pt.kg).toFixed(1)}`)
    .join(" ")} Z`;

  const goal = p.planned[p.planned.length - 1];
  const last = p.last;
  const ink = "var(--foreground)";
  const muted = "var(--muted-foreground)";

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6">
        {/* Legenda — a identidade nunca depende só da cor (formas distintas). */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3.5 rounded-full bg-gold-strong" />
            Projeção do plano
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-3.5 rounded-sm bg-gold-muted" />
            Faixa esperada
          </span>
          {hasActual ? (
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-foreground" />
              Peso registrado
            </span>
          ) : null}
        </div>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label={`Projeção de peso de ${br1(p.startKg)} kg até ${br1(p.endKg)} kg em ${p.weeks} semanas${hasActual ? ", com os pesos registrados" : ""}.`}
        >
          {/* Grade horizontal recessiva + eixo Y */}
          {yTicks(yMin, yMax).map((kg) => (
            <g key={kg}>
              <line
                x1={MARGIN.left}
                x2={W - MARGIN.right}
                y1={s.y(kg)}
                y2={s.y(kg)}
                stroke="var(--border)"
                strokeWidth={1}
              />
              <text x={MARGIN.left - 10} y={s.y(kg) + 4} textAnchor="end" fontSize={11} fill={muted}>
                {kg}
              </text>
            </g>
          ))}
          <text x={MARGIN.left - 10} y={MARGIN.top - 12} textAnchor="end" fontSize={10} fill={muted}>
            kg
          </text>

          {/* Eixo X — semanas */}
          {weekTicks.map((w) => (
            <text key={w} x={s.x(w)} y={H - 10} textAnchor="middle" fontSize={11} fill={muted}>
              {w === 0 ? "Início" : `Sem ${w}`}
            </text>
          ))}

          {/* Faixa esperada e linha do plano */}
          <path d={band} fill="var(--gold-muted)" />
          <path
            d={path(p.planned, s)}
            fill="none"
            stroke="var(--gold-strong)"
            strokeWidth={2}
            strokeLinecap="round"
          />

          {/* Meta / fim do horizonte */}
          <circle
            cx={s.x(goal.week)}
            cy={s.y(goal.kg)}
            r={5}
            fill="var(--gold-strong)"
            stroke="var(--card)"
            strokeWidth={2}
          />
          <text x={s.x(goal.week) + 12} y={s.y(goal.kg) + 1} fontSize={13} fontWeight={600} fill={ink}>
            {br1(goal.kg)} kg
          </text>
          <text x={s.x(goal.week) + 12} y={s.y(goal.kg) + 15} fontSize={10.5} fill={muted}>
            {p.hasTarget ? "Meta" : "Projeção"} · semana {p.weeks}
          </text>

          {/* Caminho real — linha em tinta + pontos com anel do cartão */}
          {hasActual ? (
            <>
              <path
                d={path(p.actual, s)}
                fill="none"
                stroke={ink}
                strokeWidth={2}
                strokeLinecap="round"
              />
              {p.actual.map((pt) => (
                <circle
                  key={pt.week}
                  cx={s.x(pt.week)}
                  cy={s.y(pt.kg)}
                  r={4}
                  fill={ink}
                  stroke="var(--card)"
                  strokeWidth={2}
                />
              ))}
            </>
          ) : (
            <circle
              cx={s.x(0)}
              cy={s.y(p.startKg)}
              r={4}
              fill={ink}
              stroke="var(--card)"
              strokeWidth={2}
            />
          )}

          {/* Rótulos diretos seletivos: início e último registro */}
          <text x={s.x(0)} y={s.y(p.startKg) - 12} fontSize={12} fontWeight={600} fill={ink}>
            {br1(p.startKg)} kg
          </text>
          {last ? (
            <>
              <text
                x={s.x(last.week)}
                y={s.y(last.kg) - 26}
                textAnchor="middle"
                fontSize={10}
                fill={muted}
              >
                você está aqui
              </text>
              <text
                x={s.x(last.week)}
                y={s.y(last.kg) - 12}
                textAnchor="middle"
                fontSize={12}
                fontWeight={600}
                fill={ink}
              >
                {br1(last.kg)} kg
              </text>
            </>
          ) : null}
        </svg>

        {/* Leitura do gráfico em palavras — ritmo, faixa e veredito com solução. */}
        <div className="flex flex-wrap gap-x-6 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
          <span>
            Ritmo previsto:{" "}
            <strong className="font-semibold text-foreground">{brRate(p.weeklyKg)} kg/semana</strong>
          </span>
          <span>
            Faixa esperada:{" "}
            <strong className="font-semibold text-foreground">
              {p.weeklyKg === 0
                ? `±${WEIGHT_PROJECTION.maintenanceBandKg} kg`
                : `±${Math.round(WEIGHT_PROJECTION.bandPct * 100)}% do ritmo`}
            </strong>
          </span>
          {last ? (
            <span>
              Último registro:{" "}
              <strong className="font-semibold text-foreground">{br1(last.kg)} kg</strong> na semana{" "}
              {br1(last.week).replace(",0", "")} —{" "}
              {last.pace
                ? PACE_VERDICT[last.pace]
                : "ainda é cedo para avaliar o ritmo; continue registrando"}
            </span>
          ) : (
            <span>Registre os acompanhamentos para ver o caminho real sobre o plano.</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
