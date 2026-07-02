import * as React from "react";
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Card, CardContent } from "@/shared/components/ui/card";

interface MetricCardProps extends React.ComponentProps<"div"> {
  /** Rótulo da métrica (ex.: "Peso atual"). */
  label: string;
  /** Valor formatado (ex.: "82,4 kg"). */
  value: string;
  /** Variação opcional (ex.: "-1,2 kg em 30 dias"). */
  delta?: string;
  /** Direção da variação para o indicador visual. */
  trend?: "up" | "down" | "flat";
  /** Se a tendência atual é positiva para o objetivo do aluno. */
  trendIsPositive?: boolean;
  /** Ícone opcional exibido à direita do rótulo. */
  icon?: React.ReactNode;
}

/**
 * Metric Card: exibe uma métrica única com variação e tendência.
 * A cor da tendência depende do objetivo (perder peso: queda é positiva).
 */
function MetricCard({
  label,
  value,
  delta,
  trend = "flat",
  trendIsPositive = true,
  icon,
  className,
  ...props
}: MetricCardProps) {
  const TrendIcon = trend === "up" ? ArrowUpIcon : trend === "down" ? ArrowDownIcon : MinusIcon;

  return (
    <Card className={cn("gap-0 py-4", className)} {...props}>
      <CardContent className="flex flex-col gap-1.5 px-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </span>
          {icon ? <span className="text-muted-foreground [&>svg]:size-4">{icon}</span> : null}
        </div>
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        {delta ? (
          <span
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              trend === "flat"
                ? "text-muted-foreground"
                : trendIsPositive
                  ? "text-success"
                  : "text-danger",
            )}
          >
            <TrendIcon className="size-3" />
            {delta}
          </span>
        ) : null}
      </CardContent>
    </Card>
  );
}

export { MetricCard };
