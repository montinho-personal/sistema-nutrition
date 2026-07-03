"use client";

import * as React from "react";
import { SparklesIcon, WandSparklesIcon, XIcon } from "lucide-react";

import { Card, CardContent } from "@/shared/components/ui/card";
import { Textarea } from "@/shared/components/ui/textarea";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { parseDirective } from "@/modules/meal-plan/services";

const EXAMPLES = [
  "1700 kcal com zero carboidrato à noite",
  "Quero uma dieta mais barata",
  "Refeições extremamente rápidas",
];

/**
 * Instrução do treinador em linguagem natural (Personal Nutrition AI — Fatia A).
 * O treinador escreve como falaria; o sistema mostra o que entendeu e remonta o
 * cardápio. A interpretação é determinística (a IA reforça na próxima fatia).
 */
export function MealInstruction({
  instruction,
  onApply,
}: {
  instruction: string;
  onApply: (text: string) => void;
}) {
  // O rascunho parte da instrução persistida; o componente é remontado (key no
  // pai) quando ela muda, então nada de setState em efeito.
  const [draft, setDraft] = React.useState(instruction);

  // Prévia do que será entendido, enquanto digita.
  const preview = React.useMemo(() => parseDirective(draft), [draft]);
  const dirty = draft.trim() !== instruction.trim();

  return (
    <Card className="border-l-2 border-l-gold">
      <CardContent className="flex flex-col gap-3 pt-6">
        <div className="flex items-center gap-2">
          <WandSparklesIcon className="size-4 text-gold" />
          <span className="text-sm font-semibold">Instrução do treinador</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Escreva como falaria. O cardápio se ajusta à sua intenção — o resto da estratégia do
          aluno é mantido automaticamente.
        </p>

        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ex.: 1700 kcal, sem carboidrato à noite, mais barato e prático"
          rows={2}
          className="resize-none"
        />

        {preview.recognized.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="flex items-center gap-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              <SparklesIcon className="size-3 text-gold" />
              Entendi
            </span>
            {preview.recognized.map((r) => (
              <Badge key={r} variant="secondary">
                {r}
              </Badge>
            ))}
          </div>
        ) : draft.trim() ? (
          <p className="text-xs text-muted-foreground">
            Ainda não reconheci um ajuste — tente algo como os exemplos abaixo.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setDraft(ex)}
                className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
              >
                {ex}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => onApply(draft)} disabled={!dirty}>
            <WandSparklesIcon className="size-4" />
            Aplicar ao cardápio
          </Button>
          {instruction.trim() ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraft("");
                onApply("");
              }}
            >
              <XIcon className="size-4" />
              Limpar
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
