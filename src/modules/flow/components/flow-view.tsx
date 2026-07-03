"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  CloudIcon,
  UsersIcon,
} from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import { PageHeader } from "@/shared/components/page-header";
import { EmptyState } from "@/shared/components/empty-state";
import { LoadingScreen } from "@/shared/components/loading-screen";
import { FLOW_STEPS, flowStepIndex } from "@/modules/flow/constants/steps";
import { useFlowData } from "@/modules/flow/hooks/use-flow-data";
import { useFlowStep } from "@/modules/flow/hooks/use-flow-step";
import { FlowStepper } from "@/modules/flow/components/flow-stepper";
import { StrategyRail } from "@/modules/flow/components/strategy-rail";
import { FlowStepBody } from "@/modules/flow/components/flow-step-body";

/**
 * Flow Shell (Workflow V1 — Sprint 0): o percurso guiado de 7 etapas. Sequencia
 * os módulos existentes com barra de progresso, navegação, auto-save e a
 * Strategy Rail sempre à vista. Cada etapa embute a view atual ou dá o atalho
 * para ela — as próximas sprints substituem cada corpo pela versão redesenhada.
 */
export function FlowView({ studentId }: { studentId: string }) {
  const data = useFlowData(studentId);
  const { saved, select: selectStep } = useFlowStep(studentId);

  if (!data.ready) {
    return <LoadingScreen messages={["Abrindo o fluxo..."]} />;
  }

  if (!data.student) {
    return (
      <>
        <PageHeader title="Fluxo" />
        <EmptyState
          icon={<UsersIcon />}
          title="Aluno não encontrado"
          description="Esse aluno não existe neste dispositivo. Volte e selecione um aluno da lista."
          action={
            <Button asChild variant="outline">
              <Link href="/flow">
                <ArrowLeftIcon className="size-4" />
                Escolher aluno
              </Link>
            </Button>
          }
        />
      </>
    );
  }

  // Retoma da etapa salva (se ainda alcançável) ou da primeira pendente.
  const currentId =
    saved && data.stepState[saved]?.reachable ? saved : data.firstActionable;
  const index = flowStepIndex(currentId);
  const step = FLOW_STEPS[index];
  const prev = FLOW_STEPS[index - 1] ?? null;
  const next = FLOW_STEPS[index + 1] ?? null;
  const nextReachable = next ? data.stepState[next.id].reachable : false;
  const percent = Math.round(((index + 1) / FLOW_STEPS.length) * 100);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Montar estratégia"
        description={data.student.fullName}
        actions={
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
              <CloudIcon className="size-3.5 text-success" />
              Salvo automaticamente
            </span>
            <Button asChild variant="ghost" size="sm">
              <Link href="/flow">
                <UsersIcon className="size-4" />
                Trocar aluno
              </Link>
            </Button>
          </div>
        }
      />

      {/* Progresso + stepper */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            Etapa {step.order} de {FLOW_STEPS.length} · {step.title}
          </span>
          <span className="text-xs text-muted-foreground">{percent}%</span>
        </div>
        <Progress value={percent} />
        <FlowStepper currentId={currentId} stepState={data.stepState} onSelect={selectStep} />
      </div>

      {/* Corpo + Strategy Rail. No mobile a rail sobe para o topo (contexto
          antes do corpo longo); no desktop volta para a coluna lateral fixa. */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_18rem]">
        <div className="flex min-w-0 flex-col gap-6">
          {/* Transição suave a cada troca de etapa — a key remonta e reanima. */}
          <motion.div
            key={currentId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold tracking-[0.14em] text-gold uppercase">
                Etapa {step.order} de {FLOW_STEPS.length}
              </span>
              <h2 className="text-xl font-semibold tracking-tight">{step.title}</h2>
              <p className="text-sm text-muted-foreground">{step.short}</p>
            </div>

            <FlowStepBody step={currentId} data={data} studentId={studentId} />
          </motion.div>

          <div className="flex items-center justify-between border-t pt-4">
            <Button
              variant="ghost"
              onClick={() => prev && selectStep(prev.id)}
              disabled={!prev}
            >
              <ArrowLeftIcon className="size-4" />
              Voltar
            </Button>
            {next ? (
              <Button onClick={() => nextReachable && selectStep(next.id)} disabled={!nextReachable}>
                {nextReachable ? "Continuar" : `Conclua "${step.title}" para seguir`}
                <ArrowRightIcon className="size-4" />
              </Button>
            ) : (
              <span className="flex items-center gap-1.5 text-sm font-medium text-success">
                <CheckIcon className="size-4" />
                Fim do fluxo
              </span>
            )}
          </div>
        </div>

        <div className="order-first xl:order-last xl:sticky xl:top-4 xl:self-start">
          <StrategyRail data={data} studentId={studentId} />
        </div>
      </div>
    </div>
  );
}
