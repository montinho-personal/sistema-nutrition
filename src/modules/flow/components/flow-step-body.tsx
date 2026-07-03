"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  ClipboardListIcon,
  FileTextIcon,
  LayersIcon,
  LockIcon,
  ShieldCheckIcon,
  StethoscopeIcon,
  UtensilsIcon,
} from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { EmptyState } from "@/shared/components/empty-state";
import { MetricCard } from "@/shared/components/metric-card";
import { DiagnosisSummary } from "@/modules/diagnosis/components/diagnosis-summary";
import { PHILOSOPHY_LABELS } from "@/modules/strategy/constants/parameters";
import { FlowStrategyStep } from "@/modules/flow/components/flow-strategy-step";
import type { FlowData } from "@/modules/flow/hooks/use-flow-data";
import type { FlowStepId } from "@/modules/flow/types";

/** Cartão de "abra a ferramenta completa" — usado onde a etapa ainda não foi
 *  embutida no fluxo (será nas próximas sprints). */
function OpenToolCard({
  icon,
  title,
  description,
  href,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <Card className="border-l-2 border-l-gold">
      <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-gold [&>svg]:size-5">{icon}</span>
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">{title}</span>
            <span className="text-sm text-muted-foreground">{description}</span>
          </div>
        </div>
        <Button asChild className="shrink-0">
          <Link href={href}>
            {cta}
            <ArrowRightIcon className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function LockedStep({ description }: { description: string }) {
  return (
    <EmptyState icon={<LockIcon />} title="Conclua a etapa anterior" description={description} />
  );
}

/** Corpo da etapa atual do fluxo. Reaproveita as views existentes quando elas
 *  já renderizam sem cabeçalho próprio; para as demais, oferece o atalho para a
 *  ferramenta completa até serem embutidas nas próximas sprints. */
export function FlowStepBody({
  step,
  data,
  studentId,
}: {
  step: FlowStepId;
  data: FlowData;
  studentId: string;
}) {
  const { student, session, strategy, macros, stepState } = data;
  if (!student) return null;

  switch (step) {
    case "anamnese":
      return session?.status === "completed" ? (
        <OpenToolCard
          icon={<StethoscopeIcon />}
          title="Anamnese concluída"
          description="Você pode revisar ou refazer as respostas a qualquer momento."
          href={`/diagnosis/${studentId}`}
          cta="Revisar anamnese"
        />
      ) : (
        <OpenToolCard
          icon={<StethoscopeIcon />}
          title="Entrevista do aluno"
          description="Conduza a anamnese adaptativa. O resumo é gerado ao final."
          href={`/diagnosis/${studentId}`}
          cta="Abrir anamnese"
        />
      );

    case "diagnostico":
      return session?.status === "completed" ? (
        <DiagnosisSummary answers={session.answers} student={student} />
      ) : (
        <LockedStep description="Conclua a anamnese para o sistema gerar o diagnóstico do aluno." />
      );

    case "estrategia":
      if (!stepState.estrategia.reachable) {
        return (
          <LockedStep description="Conclua a anamnese e defina o objetivo do aluno para montar a estratégia." />
        );
      }
      return <FlowStrategyStep data={data} studentId={studentId} />;

    case "alimentar":
      if (!strategy) {
        return <LockedStep description="Defina a estratégia antes de escolher a abordagem alimentar." />;
      }
      return (
        <div className="flex flex-col gap-3">
          <Card>
            <CardContent className="flex flex-col gap-2 pt-6">
              <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Abordagem sugerida
              </span>
              <div className="flex items-center gap-2">
                <LayersIcon className="size-5 text-gold" />
                <span className="text-lg font-semibold">
                  {PHILOSOPHY_LABELS[strategy.philosophy]}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                A escolha entre abordagens (Tradicional, Flexível, Low Carb, Jejum, Carb Cycling…) e
                a redistribuição automática de refeições e macros chega na próxima sprint desta etapa.
              </p>
            </CardContent>
          </Card>
        </div>
      );

    case "cardapio":
      if (!macros) {
        return <LockedStep description="Defina a estratégia e os macros antes de montar o cardápio." />;
      }
      return (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard label="Calorias-alvo" value={`${macros.calories} kcal`} />
            <MetricCard label="Proteína" value={`${macros.proteinG} g`} />
            <MetricCard label="Carboidrato" value={`${macros.carbG} g`} />
            <MetricCard label="Gordura" value={`${macros.fatG} g`} />
          </div>
          <OpenToolCard
            icon={<UtensilsIcon />}
            title="Montar o cardápio"
            description="O plano do dia é montado a partir destes macros e do banco de alimentos."
            href={`/meal-plan/${studentId}`}
            cta="Abrir plano alimentar"
          />
        </div>
      );

    case "validacao":
      if (!macros) {
        return <LockedStep description="Monte a estratégia e o cardápio para rodar a validação." />;
      }
      return (
        <EmptyState
          icon={<ShieldCheckIcon />}
          title="Auditoria automática"
          description="A validação da estratégia (proteína, fibras, aderência, planos para viagem e fim de semana, plano B…) chega na sprint desta etapa. Por ora, os alertas ativos aparecem na barra lateral."
        />
      );

    case "documento":
      if (!macros) {
        return <LockedStep description="Conclua as etapas anteriores para gerar o documento." />;
      }
      return (
        <OpenToolCard
          icon={<FileTextIcon />}
          title="Documento do aluno"
          description="Gere o relatório com o diagnóstico, a estratégia e o plano. A versão premium chega na sprint desta etapa."
          href={`/reports/${studentId}`}
          cta="Abrir relatório"
        />
      );

    default:
      return (
        <EmptyState icon={<ClipboardListIcon />} title="Etapa" description="Em construção." />
      );
  }
}
