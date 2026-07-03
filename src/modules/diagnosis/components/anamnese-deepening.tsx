"use client";

import * as React from "react";
import { SparklesIcon } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { SectionHeader } from "@/shared/components/section-header";
import { isAiEnabled } from "@/config/env";
import { deepenAnamneseAction } from "@/modules/diagnosis/services/deepenAnamnese.action";
import type { DeepeningQuestion } from "@/modules/diagnosis/services/aiAnamneseDeepening";
import type { AnswerMap } from "@/modules/diagnosis/types";
import type { StudentGoal } from "@/modules/students/types";

/**
 * Aprofundamento da anamnese por IA (híbrida — Workflow V1). A entrevista base
 * é determinística; aqui a IA age como um nutricionista sênior e aponta as
 * perguntas de maior peso que ainda valem a pena — para nenhuma informação
 * importante ficar de fora. Só aparece quando a IA está habilitada.
 */
export function AnamneseDeepening({
  answers,
  goal,
}: {
  answers: AnswerMap;
  goal: StudentGoal | null;
}) {
  const [questions, setQuestions] = React.useState<DeepeningQuestion[] | null>(null);
  const [loading, setLoading] = React.useState(false);

  if (!isAiEnabled) return null;

  const run = async () => {
    setLoading(true);
    try {
      const res = await deepenAnamneseAction(answers, goal);
      if (res.status === "ok") {
        setQuestions(res.questions);
        if (res.questions.length === 0) {
          toast.info("A IA considerou a anamnese completa — nada relevante faltando.");
        }
      } else if (res.status === "unavailable") {
        toast.error("A IA não está configurada neste ambiente.");
      } else {
        toast.error("Não foi possível aprofundar com IA agora. A anamnese segue completa.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex flex-col gap-3">
      <SectionHeader
        title="Aprofundar com IA"
        description="Uma revisão da anamnese, como um nutricionista sênior faria — o que ainda vale a pena perguntar."
      />

      {questions === null ? (
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => void run()}
          disabled={loading}
        >
          <SparklesIcon className="size-4 text-gold" />
          {loading ? "A IA está revisando a anamnese..." : "Revisar e aprofundar com IA"}
        </Button>
      ) : questions.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <SparklesIcon className="size-3.5 text-gold" />
            Perguntas que ainda valem a pena
          </span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {questions.map((q) => (
              <Card key={q.id} className="border-l-2 border-l-gold">
                <CardContent className="flex flex-col gap-1.5 pt-5">
                  <Badge variant="secondary" className="w-fit">
                    {q.topic}
                  </Badge>
                  <p className="text-sm font-medium">{q.question}</p>
                  <p className="text-xs text-muted-foreground">{q.why}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          A IA considerou a anamnese completa — nada importante faltando.
        </p>
      )}
    </section>
  );
}
