import * as React from "react";

import { cn } from "@/shared/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

interface DecisionCardProps extends React.ComponentProps<"div"> {
  /** A decisão tomada (ex.: "Déficit moderado"). */
  decision: string;
  /** Por que foi escolhida — obrigatório: nenhuma decisão sem justificativa. */
  reason: string;
  /** Benefícios esperados. */
  benefits?: string[];
  /** Riscos conhecidos — sempre acompanhados de orientação. */
  risks?: string[];
  /** Alternativas consideradas e descartadas. */
  alternatives?: string[];
}

function DecisionSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </span>
      <ul className="list-inside list-disc space-y-0.5 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Decision Card (Documento 02 — Engine View): apresenta uma decisão do
 * sistema com motivo, benefícios, riscos e alternativas. O sistema nunca
 * responde apenas "faça isso" — sempre "escolhemos porque...".
 */
function DecisionCard({
  decision,
  reason,
  benefits = [],
  risks = [],
  alternatives = [],
  className,
  ...props
}: DecisionCardProps) {
  return (
    <Card className={cn("gap-4 border-l-2 border-l-gold", className)} {...props}>
      <CardHeader>
        <CardTitle className="text-base">{decision}</CardTitle>
        <CardDescription>{reason}</CardDescription>
      </CardHeader>
      {(benefits.length > 0 || risks.length > 0 || alternatives.length > 0) && (
        <CardContent className="flex flex-col gap-3">
          <DecisionSection title="Benefícios" items={benefits} />
          <DecisionSection title="Riscos" items={risks} />
          <DecisionSection title="Alternativas descartadas" items={alternatives} />
        </CardContent>
      )}
    </Card>
  );
}

export { DecisionCard };
