import * as React from "react";
import { AlertTriangleIcon, LightbulbIcon, SparklesIcon, TargetIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";

export type InsightKind = "hypothesis" | "risk" | "opportunity" | "recommendation";

interface InsightCardProps extends React.ComponentProps<"div"> {
  /** Natureza do insight — define ícone e cor. */
  kind: InsightKind;
  /** Título curto do insight. */
  title: string;
  /** Descrição breve — nunca blocos gigantes de texto (Documento 02). */
  description?: string;
  /** Nível de confiança 0–100, quando aplicável (hipóteses). */
  confidence?: number;
}

const kindConfig: Record<
  InsightKind,
  { icon: React.ElementType; label: string; iconClass: string }
> = {
  hypothesis: { icon: SparklesIcon, label: "Hipótese", iconClass: "text-gold" },
  risk: { icon: AlertTriangleIcon, label: "Risco", iconClass: "text-warning" },
  opportunity: { icon: LightbulbIcon, label: "Oportunidade", iconClass: "text-success" },
  recommendation: { icon: TargetIcon, label: "Recomendação", iconClass: "text-foreground" },
};

/**
 * Insight Card: unidade de exibição do Insights Panel (Documento 09).
 * Mostra hipóteses, riscos, oportunidades e recomendações do sistema.
 */
function InsightCard({
  kind,
  title,
  description,
  confidence,
  className,
  ...props
}: InsightCardProps) {
  const config = kindConfig[kind];
  const Icon = config.icon;

  return (
    <div
      className={cn("flex items-start gap-3 rounded-lg border bg-card p-3 text-sm", className)}
      {...props}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", config.iconClass)} aria-hidden />
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            {config.label}
          </span>
          {typeof confidence === "number" ? (
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {Math.round(confidence)}% confiança
            </span>
          ) : null}
        </div>
        <p className="leading-snug font-medium">{title}</p>
        {description ? (
          <p className="text-xs leading-snug text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

export { InsightCard };
