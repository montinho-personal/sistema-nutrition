"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BrainIcon,
  CheckIcon,
  ClockIcon,
  DumbbellIcon,
  FlameIcon,
  HeartIcon,
  HomeIcon,
  type LucideIcon,
  ScaleIcon,
  SparklesIcon,
  StethoscopeIcon,
  TargetIcon,
  UtensilsIcon,
  WalletIcon,
} from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { STAGES, visibleQuestionsForStage } from "@/modules/diagnosis/constants/questionnaire";
import { QuestionField } from "@/modules/diagnosis/components/question-field";
import { DiagnosisInsights } from "@/modules/diagnosis/components/diagnosis-insights";
import type { AnswerMap, AnswerValue } from "@/modules/diagnosis/types";

/** Ícone de cada etapa — puramente visual (o dado da etapa vive em `questionnaire`). */
const STAGE_ICONS: Record<string, LucideIcon> = {
  objetivo: TargetIcon,
  corporal: ScaleIcon,
  rotina: ClockIcon,
  saude: StethoscopeIcon,
  comportamento: FlameIcon,
  alimentacao: UtensilsIcon,
  psicologico: BrainIcon,
  ambiente: HomeIcon,
  treino: DumbbellIcon,
  preferencias: HeartIcon,
  orcamento: WalletIcon,
};

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
  const StageIcon = STAGE_ICONS[stage.id] ?? SparklesIcon;
  const percent = Math.round(((index + 1) / total) * 100);
  const nextStage = isLast ? null : STAGES[index + 1];

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6",
        showInsights && "2xl:grid-cols-[1fr_340px]",
      )}
    >
      <div className="flex min-w-0 flex-col gap-6">
        {/* Trilha da jornada — barra segmentada (progresso + navegação de volta).
            Cada segmento é uma etapa; concluídas e atual em dourado. Não é uma
            pergunta: é o mapa do percurso (Documento 07 — nunca parecer formulário). */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1" role="list" aria-label="Progresso da anamnese">
            {STAGES.map((s, i) => {
              const reachable = i <= index;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="listitem"
                  aria-label={`Etapa ${i + 1} de ${total}: ${s.title}`}
                  aria-current={i === index ? "step" : undefined}
                  title={s.title}
                  disabled={!reachable}
                  onClick={() => reachable && onStageChange(i)}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-all duration-500",
                    reachable ? "cursor-pointer bg-gold" : "cursor-default bg-primary/10",
                    i === index && "h-2 shadow-[0_1px_10px] shadow-gold/40",
                    i < index && "bg-gold/70 hover:bg-gold",
                  )}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-between text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            <span>
              Etapa {index + 1} de {total}
            </span>
            <span>
              {nextStage ? (
                <>A seguir · {nextStage.title}</>
              ) : (
                "Última etapa"
              )}
            </span>
          </div>
        </div>

        {/* Conteúdo da etapa — cabeçalho editorial + perguntas, com transição suave */}
        <motion.div
          key={stage.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="flex flex-col gap-6"
        >
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gold/10 ring-1 ring-gold/20 [&>svg]:size-6 [&>svg]:text-gold">
              <StageIcon />
            </div>
            <div className="flex min-w-0 flex-col gap-1 pt-0.5">
              <span className="text-[11px] font-semibold tracking-[0.14em] text-gold uppercase">
                {percent}% do caminho
              </span>
              <h2 className="text-xl font-semibold tracking-tight text-balance">{stage.title}</h2>
              <p className="text-sm text-pretty text-muted-foreground">{stage.description}</p>
            </div>
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
        </motion.div>

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
