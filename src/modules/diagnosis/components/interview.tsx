"use client";

import * as React from "react";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, SparklesIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import { Card, CardContent } from "@/shared/components/ui/card";
import { STAGES, visibleQuestionsForStage } from "@/modules/diagnosis/constants/questionnaire";
import { QuestionField } from "@/modules/diagnosis/components/question-field";
import { DiagnosisInsights } from "@/modules/diagnosis/components/diagnosis-insights";
import type { AnswerMap, AnswerValue } from "@/modules/diagnosis/types";

interface InterviewProps {
  answers: AnswerMap;
  stageIndex: number;
  onAnswer: (key: string, value: AnswerValue) => void;
  onStageChange: (index: number) => void;
  onComplete: () => void;
  /** Mostra o painel do NDE em tempo real (uso do treinador). */
  showInsights?: boolean;
  /** Rótulo do botão final (ex.: "Finalizar" na versão do aluno). */
  completeLabel?: string;
}

/** Entrevista Estratégica: uma etapa por vez, com insights em tempo real (Documento 07). */
export function Interview({
  answers,
  stageIndex,
  onAnswer,
  onStageChange,
  onComplete,
  showInsights = true,
  completeLabel = "Concluir diagnóstico",
}: InterviewProps) {
  const total = STAGES.length;
  const index = Math.max(0, Math.min(total - 1, stageIndex));
  const stage = STAGES[index];
  const questions = visibleQuestionsForStage(stage.id, answers);
  const isLast = index === total - 1;

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6",
        showInsights && "2xl:grid-cols-[1fr_340px]",
      )}
    >
      <div className="flex min-w-0 flex-col gap-5">
        {/* Progresso */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              Etapa {index + 1} de {total} · {stage.title}
            </span>
            <span className="text-xs text-muted-foreground">
              {Math.round(((index + 1) / total) * 100)}%
            </span>
          </div>
          <Progress value={((index + 1) / total) * 100} />
          <p className="text-sm text-muted-foreground">{stage.description}</p>
        </div>

        {/* Navegação por etapas (permitir voltar — Documento 07) */}
        <div className="flex flex-wrap gap-1.5">
          {STAGES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onStageChange(i)}
              className={cn(
                "rounded-md px-2 py-1 text-xs transition-colors",
                i === index
                  ? "bg-primary text-primary-foreground"
                  : i < index
                    ? "bg-accent text-accent-foreground hover:bg-accent/80"
                    : "text-muted-foreground hover:bg-accent",
              )}
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* Perguntas da etapa */}
        <div className="flex flex-col gap-6">
          {questions.map((question) => (
            <QuestionField
              key={question.key}
              question={question}
              value={answers[question.key]}
              onChange={(value) => onAnswer(question.key, value)}
            />
          ))}
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-between border-t pt-4">
          <Button variant="ghost" onClick={() => onStageChange(index - 1)} disabled={index === 0}>
            <ArrowLeftIcon className="size-4" />
            Voltar
          </Button>
          {isLast ? (
            <Button variant="gold" onClick={onComplete}>
              <CheckIcon className="size-4" />
              {completeLabel}
            </Button>
          ) : (
            <Button onClick={() => onStageChange(index + 1)}>
              Continuar
              <ArrowRightIcon className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Insights em tempo real (apenas no uso do treinador) */}
      {showInsights ? (
        <aside className="2xl:sticky 2xl:top-4 2xl:self-start">
          <Card className="gap-0 py-4">
            <CardContent className="flex flex-col gap-3 px-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <SparklesIcon className="size-4 text-gold" />
                Nutrition Decision Engine
              </div>
              <DiagnosisInsights answers={answers} />
            </CardContent>
          </Card>
        </aside>
      ) : null}
    </div>
  );
}
