import * as React from "react";

import { cn } from "@/shared/lib/utils";
import { Card, CardContent } from "@/shared/components/ui/card";

export type ScoreTone = "positive" | "neutral" | "negative";

interface ScoreCardProps extends React.ComponentProps<"div"> {
  /** Rótulo do indicador (ex.: "Aderência"). */
  label: string;
  /** Valor de 0 a 100. */
  score: number;
  /**
   * Direção semântica do score. Em "risco", 100 é ruim — usar `invert`.
   */
  invert?: boolean;
  /** Texto auxiliar opcional (ex.: "Muito alta"). */
  hint?: string;
}

function scoreTone(score: number, invert: boolean): ScoreTone {
  const effective = invert ? 100 - score : score;
  if (effective >= 70) return "positive";
  if (effective >= 40) return "neutral";
  return "negative";
}

const toneStyles: Record<ScoreTone, { text: string; bar: string }> = {
  positive: { text: "text-success", bar: "bg-success" },
  neutral: { text: "text-warning", bar: "bg-warning" },
  negative: { text: "text-danger", bar: "bg-danger" },
};

/**
 * Score Card (Documento 02 — Score System): transforma informação complexa
 * em um indicador simples de 0 a 100, com semáforo visual.
 */
function ScoreCard({ label, score, invert = false, hint, className, ...props }: ScoreCardProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const tone = scoreTone(clamped, invert);
  const styles = toneStyles[tone];

  return (
    <Card className={cn("gap-0 py-4", className)} {...props}>
      <CardContent className="flex flex-col gap-2 px-4">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
        <div className="flex items-baseline gap-2">
          <span className={cn("text-3xl font-semibold tabular-nums", styles.text)}>{clamped}</span>
          {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={clamped}
          aria-label={label}
        >
          <div
            className={cn("h-full rounded-full transition-all", styles.bar)}
            style={{ width: `${clamped}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export { ScoreCard };
