"use client";

import * as React from "react";
import { CheckCircle2Icon, ClipboardCheckIcon, CopyIcon, HeartPulseIcon, SendIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Textarea } from "@/shared/components/ui/textarea";
import { Interview } from "@/modules/diagnosis/components/interview";
import { encodeAnamnese, isAnamneseSyncEnabled, submitAnamnese } from "@/modules/diagnosis/services";
import type { AnswerMap, AnswerValue } from "@/modules/diagnosis/types";

type Phase = "welcome" | "interview" | "done";
type SyncState = "idle" | "sending" | "sent" | "failed";

/** Cabeçalho simples da página pública (sem App Shell). */
function PublicHeader() {
  return (
    <header className="flex items-center gap-2 border-b px-4 py-3">
      <div className="flex size-7 items-center justify-center rounded-md bg-gold">
        <span className="text-xs font-bold text-gold-foreground">M</span>
      </div>
      <span className="text-sm font-semibold tracking-tight">Montinho Nutrition Strategy</span>
    </header>
  );
}

/**
 * Anamnese pública (sem login): o aluno preenche no próprio dispositivo e, ao
 * final, recebe um código para enviar de volta ao personal.
 */
export function PublicAnamnese({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  const [phase, setPhase] = React.useState<Phase>("welcome");
  const [answers, setAnswers] = React.useState<AnswerMap>({});
  const [stageIndex, setStageIndex] = React.useState(0);
  const [syncState, setSyncState] = React.useState<SyncState>("idle");

  const firstName = studentName.trim().split(/\s+/)[0] || "";

  // Ao concluir: se o Supabase estiver ligado, envia direto ao personal;
  // senão, o aluno devolve o código manualmente.
  const finish = React.useCallback(() => {
    setPhase("done");
    if (isAnamneseSyncEnabled()) {
      setSyncState("sending");
      submitAnamnese({ studentId, studentName, answers }).then((ok) =>
        setSyncState(ok ? "sent" : "failed"),
      );
    }
  }, [studentId, studentName, answers]);

  const code = React.useMemo(
    () => (phase === "done" ? encodeAnamnese({ studentId, studentName, answers }) : ""),
    [phase, studentId, studentName, answers],
  );

  const setAnswer = React.useCallback((key: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }, []);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Código copiado! Cole na conversa com seu personal.");
    } catch {
      toast.error("Não foi possível copiar — selecione e copie manualmente.");
    }
  };

  const shareWhatsApp = () => {
    const text = `Olá! Terminei minha anamnese. Aqui está o meu código de respostas:\n\n${code}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  // Link sem aluno associado — o personal precisa gerar um novo.
  if (!studentId) {
    return (
      <div className="flex min-h-dvh flex-col">
        <PublicHeader />
        <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4">
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <HeartPulseIcon className="size-8 text-gold" />
              <h1 className="text-lg font-semibold">Link inválido</h1>
              <p className="text-sm text-muted-foreground">
                Este link não está associado a um aluno. Peça ao seu personal um novo link da
                anamnese.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
        {phase === "welcome" ? (
          <Card>
            <CardContent className="flex flex-col items-start gap-4 py-8">
              <HeartPulseIcon className="size-8 text-gold" />
              <div className="flex flex-col gap-1">
                <h1 className="text-xl font-semibold">
                  {firstName ? `Olá, ${firstName}!` : "Olá!"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Vamos entender o seu momento para montar a melhor estratégia para você. São
                  algumas perguntas rápidas — leva cerca de 5 minutos. Não existe resposta certa ou
                  errada: seja sincero(a).
                </p>
              </div>
              <Button variant="gold" onClick={() => setPhase("interview")}>
                Começar
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {phase === "interview" ? (
          <Interview
            answers={answers}
            stageIndex={stageIndex}
            onAnswer={setAnswer}
            onStageChange={setStageIndex}
            onComplete={finish}
            showInsights={false}
            completeLabel="Finalizar anamnese"
          />
        ) : null}

        {phase === "done" ? (
          syncState === "sending" || syncState === "sent" ? (
            <Card className="border-l-2 border-l-gold">
              <CardContent className="flex flex-col gap-3 py-8">
                <div className="flex items-center gap-2">
                  <CheckCircle2Icon className="size-5 text-success" />
                  <h1 className="text-lg font-semibold">
                    {syncState === "sending" ? "Enviando suas respostas..." : "Tudo certo. Obrigado!"}
                  </h1>
                </div>
                <p className="text-sm text-muted-foreground">
                  {syncState === "sending"
                    ? "Só um instante enquanto enviamos ao seu personal."
                    : "Suas respostas foram enviadas ao seu personal. Ele já pode montar sua estratégia — você pode fechar esta página."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              <Card className="border-l-2 border-l-gold">
                <CardContent className="flex flex-col gap-3 py-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2Icon className="size-5 text-success" />
                    <h1 className="text-lg font-semibold">Anamnese concluída. Obrigado!</h1>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Falta um passo: envie o código abaixo para o seu personal. É com ele que a
                    estratégia será montada.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="gold" onClick={shareWhatsApp}>
                      <SendIcon className="size-4" />
                      Enviar no WhatsApp
                    </Button>
                    <Button variant="outline" onClick={copyCode}>
                      <CopyIcon className="size-4" />
                      Copiar código
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-2">
                <span className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  <ClipboardCheckIcon className="size-3.5" />
                  Seu código de respostas
                </span>
                <Textarea
                  readOnly
                  value={code}
                  rows={5}
                  className="font-mono text-xs"
                  onFocus={(e) => e.currentTarget.select()}
                />
              </div>
            </div>
          )
        ) : null}
      </main>
    </div>
  );
}
