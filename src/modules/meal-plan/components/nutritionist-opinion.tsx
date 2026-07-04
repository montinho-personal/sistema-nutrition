"use client";

import * as React from "react";
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  HistoryIcon,
  ShieldCheckIcon,
  StethoscopeIcon,
  TargetIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  UtensilsCrossedIcon,
} from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type {
  NutritionistOpinion,
  OpinionRisk,
} from "@/modules/meal-plan/services/nutritionistOpinion";

function SubSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
        {icon}
        {title}
      </span>
      {children}
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm">
          <span className="mt-1.5 inline-block size-1 shrink-0 rounded-full bg-gold" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function LearningList({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-2.5">
      <span className="flex items-center gap-1.5 text-xs font-medium">
        {icon}
        {title}
      </span>
      <ul className="flex flex-col gap-0.5 text-xs text-muted-foreground">
        {items.map((it) => (
          <li key={it}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

const RISK_DOT: Record<OpinionRisk["level"], string> = {
  info: "text-muted-foreground",
  attention: "text-warning",
  high: "text-danger",
};

/**
 * Parecer do Nutricionista (Personal Nutrition AI — Fatia B). O raciocínio
 * individualizado por trás do plano — leitura do caso, por que a estratégia e o
 * cardápio, o que respeita, riscos com solução e próximos passos. Determinístico
 * e específico do aluno; nunca genérico.
 */
export function NutritionistOpinion({ opinion }: { opinion: NutritionistOpinion }) {
  return (
    <Card className="gap-5 border-l-2 border-l-gold">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex size-7 items-center justify-center rounded-lg bg-gold/10 text-gold ring-1 ring-gold/20">
            <StethoscopeIcon className="size-4" />
          </span>
          Parecer do nutricionista
        </CardTitle>
        <CardDescription>Como o melhor nutricionista esportivo explicaria este plano.</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        <p className="border-l-2 border-l-gold/40 pl-3 text-sm font-medium text-pretty">
          {opinion.headline}
        </p>

        <SubSection icon={<StethoscopeIcon className="size-3.5" />} title="Leitura do caso">
          <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            {opinion.reading.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </SubSection>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <SubSection icon={<ActivityIcon className="size-3.5" />} title="Por que esta estratégia">
            <Bullets items={opinion.strategyRationale} />
          </SubSection>
          <SubSection icon={<UtensilsCrossedIcon className="size-3.5" />} title="Por que este cardápio">
            <Bullets items={opinion.menuRationale} />
          </SubSection>
        </div>

        <SubSection icon={<TargetIcon className="size-3.5" />} title="O que este plano respeita">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {opinion.respects.map((c) => (
              <div key={c.label} className="flex items-start gap-2 rounded-lg bg-muted/50 p-2.5">
                {c.status === "ok" ? (
                  <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-success" />
                ) : (
                  <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-warning" />
                )}
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium">{c.label}</span>
                  <span className="text-xs text-muted-foreground">{c.reason}</span>
                </div>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection icon={<ShieldCheckIcon className="size-3.5" />} title="Riscos e atenção">
          {opinion.risks.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2Icon className="size-4 text-success" />
              Nenhum risco crítico — o plano está dentro dos parâmetros seguros.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {opinion.risks.map((r) => (
                <li key={r.title} className="flex items-start gap-2">
                  <AlertTriangleIcon className={cn("mt-0.5 size-4 shrink-0", RISK_DOT[r.level])} />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{r.title}</span>
                    <span className="flex items-start gap-1 text-xs text-muted-foreground">
                      <ArrowRightIcon className="mt-0.5 size-3 shrink-0 text-gold" />
                      {r.solution}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SubSection>

        <SubSection icon={<HistoryIcon className="size-3.5" />} title="Memória e evolução">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">{opinion.memory.headline}</p>
            {opinion.memory.notes.length > 0 ? <Bullets items={opinion.memory.notes} /> : null}
            {opinion.memory.whatWorked.length > 0 || opinion.memory.whatFailed.length > 0 ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {opinion.memory.whatWorked.length > 0 ? (
                  <LearningList
                    icon={<ThumbsUpIcon className="size-3.5 text-success" />}
                    title="Funcionou"
                    items={opinion.memory.whatWorked}
                  />
                ) : null}
                {opinion.memory.whatFailed.length > 0 ? (
                  <LearningList
                    icon={<ThumbsDownIcon className="size-3.5 text-warning" />}
                    title="Não funcionou"
                    items={opinion.memory.whatFailed}
                  />
                ) : null}
              </div>
            ) : null}
            {opinion.memory.recommendation ? (
              <p className="flex items-start gap-1.5 text-sm">
                <ArrowRightIcon className="mt-0.5 size-3.5 shrink-0 text-gold" />
                <span>{opinion.memory.recommendation}</span>
              </p>
            ) : null}
          </div>
        </SubSection>

        <SubSection icon={<ArrowRightIcon className="size-3.5" />} title="Próximos passos">
          <Bullets items={opinion.nextSteps} />
        </SubSection>
      </CardContent>
    </Card>
  );
}
