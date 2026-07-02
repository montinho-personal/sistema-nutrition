"use client";

import { Trash2Icon } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { SectionHeader } from "@/shared/components/section-header";
import {
  MEASUREMENT_KEYS,
  MEASUREMENT_LABELS,
  SCALE_LABELS,
} from "@/modules/follow-ups/constants/parameters";
import type { FollowUp, FollowUpScales } from "@/modules/follow-ups/types";

const SCALE_KEYS: (keyof FollowUpScales)[] = ["adherence", "hunger", "sleep", "energy", "mood"];

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

/** Histórico dos acompanhamentos, do mais recente ao mais antigo. */
export function FollowUpHistory({
  followUps,
  onDelete,
}: {
  followUps: FollowUp[];
  onDelete: (id: string) => void;
}) {
  const ordered = [...followUps].reverse();

  return (
    <div className="flex flex-col gap-3">
      <SectionHeader
        title="Histórico"
        description="Cada registro alimenta a inteligência do aluno (nunca começar do zero)."
      />
      <div className="flex flex-col gap-3">
        {ordered.map((f) => (
          <Card key={f.id} className="gap-0 py-0">
            <CardContent className="flex flex-col gap-3 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{formatDate(f.date)}</span>
                  <Badge variant="secondary" className="tabular-nums">
                    {f.weightKg.toFixed(1).replace(".", ",")} kg
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground"
                  onClick={() => onDelete(f.id)}
                  aria-label="Remover acompanhamento"
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {SCALE_KEYS.map((key) => (
                  <span key={key} className="tabular-nums">
                    {SCALE_LABELS[key]} <strong className="text-foreground">{f.scales[key]}</strong>
                  </span>
                ))}
              </div>

              {f.measurements && Object.keys(f.measurements).length > 0 ? (
                <div className="flex flex-wrap gap-x-4 gap-y-1 border-t pt-2 text-xs text-muted-foreground">
                  {MEASUREMENT_KEYS.filter((key) => typeof f.measurements?.[key] === "number").map(
                    (key) => (
                      <span key={key} className="tabular-nums">
                        {MEASUREMENT_LABELS[key]}{" "}
                        <strong className="text-foreground">
                          {f.measurements![key]!.toString().replace(".", ",")} cm
                        </strong>
                      </span>
                    ),
                  )}
                </div>
              ) : null}

              {f.whatWorked || f.whatFailed || f.why ? (
                <div className="flex flex-col gap-1 border-t pt-2 text-sm">
                  {f.whatWorked ? (
                    <p>
                      <span className="text-muted-foreground">Funcionou: </span>
                      {f.whatWorked}
                    </p>
                  ) : null}
                  {f.whatFailed ? (
                    <p>
                      <span className="text-muted-foreground">Não funcionou: </span>
                      {f.whatFailed}
                    </p>
                  ) : null}
                  {f.why ? (
                    <p>
                      <span className="text-muted-foreground">Por quê: </span>
                      {f.why}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
