"use client";

import * as React from "react";
import { CopyIcon, DownloadIcon, SendIcon, Share2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { buildAnamneseUrl, decodeAnamnese, applyImportedAnswers } from "@/modules/diagnosis/services";

/**
 * Envio da anamnese para o aluno preencher (link público) e importação do
 * código de respostas recebido — o ciclo sem backend.
 */
export function ShareAnamnese({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  const [importOpen, setImportOpen] = React.useState(false);
  const [code, setCode] = React.useState("");

  const buildUrl = () =>
    buildAnamneseUrl(
      typeof window !== "undefined" ? window.location.origin : "",
      studentId,
      studentName,
    );

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(buildUrl());
      toast.success("Link copiado! Envie para o aluno preencher.");
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  };

  const shareWhatsApp = () => {
    const text = `Olá! Para montar sua estratégia nutricional, preencha esta anamnese rápida (uns 5 min):\n\n${buildUrl()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleImport = () => {
    const payload = decodeAnamnese(code);
    if (!payload) {
      toast.error("Código inválido. Peça ao aluno para reenviar.");
      return;
    }
    if (payload.studentId !== studentId) {
      toast.error("Este código é de outro aluno.");
      return;
    }
    applyImportedAnswers(studentId, payload.answers);
    setImportOpen(false);
    setCode("");
    toast.success("Respostas importadas! O diagnóstico está pronto.");
  };

  return (
    <>
      <Card className="border-l-2 border-l-gold">
        <CardContent className="flex flex-col gap-3 py-5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Share2Icon className="size-4 text-gold" />
            Prefere que o aluno preencha?
          </div>
          <p className="text-sm text-muted-foreground">
            Envie o link da anamnese. Ao terminar, o aluno recebe um código e devolve para você —
            é só importar aqui.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={shareWhatsApp}>
              <SendIcon className="size-4" />
              Enviar no WhatsApp
            </Button>
            <Button size="sm" variant="outline" onClick={copyLink}>
              <CopyIcon className="size-4" />
              Copiar link
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setImportOpen(true)}>
              <DownloadIcon className="size-4" />
              Importar respostas
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Importar respostas do aluno</DialogTitle>
            <DialogDescription>
              Cole o código que o aluno enviou. As respostas serão carregadas e o diagnóstico
              ficará pronto.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={5}
            placeholder="Cole aqui o código de respostas..."
            className="font-mono text-xs"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setImportOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={!code.trim()}>
              Importar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
