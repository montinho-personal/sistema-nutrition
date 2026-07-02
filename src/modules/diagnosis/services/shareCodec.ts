/**
 * Codec de compartilhamento da anamnese (sem backend).
 *
 * A anamnese pode ser preenchida pelo próprio aluno num link público. Como o
 * sistema é local-first (sem servidor por ora), o resultado volta ao treinador
 * como um "código" portátil — o payload das respostas serializado e em base64.
 * Determinístico e reversível (Documento 08).
 */

import type { AnswerMap } from "@/modules/diagnosis/types";

/** Versão do formato — permite evoluir o codec sem quebrar códigos antigos. */
const FORMAT_VERSION = 1;

export interface AnamnesePayload {
  version: number;
  studentId: string;
  studentName: string;
  answers: AnswerMap;
}

/** base64 seguro para URL (sem +, /, =). */
function toBase64Url(text: string): string {
  const b64 =
    typeof btoa !== "undefined"
      ? btoa(unescape(encodeURIComponent(text)))
      : Buffer.from(text, "utf-8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(code: string): string {
  const b64 = code.replace(/-/g, "+").replace(/_/g, "/");
  if (typeof atob !== "undefined") return decodeURIComponent(escape(atob(b64)));
  return Buffer.from(b64, "base64").toString("utf-8");
}

/** Serializa o payload das respostas num código portátil. */
export function encodeAnamnese(input: {
  studentId: string;
  studentName: string;
  answers: AnswerMap;
}): string {
  const payload: AnamnesePayload = {
    version: FORMAT_VERSION,
    studentId: input.studentId,
    studentName: input.studentName,
    answers: input.answers,
  };
  return toBase64Url(JSON.stringify(payload));
}

/** Lê um código de anamnese; retorna null se inválido. */
export function decodeAnamnese(code: string): AnamnesePayload | null {
  const trimmed = code.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(fromBase64Url(trimmed)) as AnamnesePayload;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.studentId !== "string" ||
      typeof parsed.answers !== "object" ||
      parsed.answers === null
    ) {
      return null;
    }
    return {
      version: typeof parsed.version === "number" ? parsed.version : FORMAT_VERSION,
      studentId: parsed.studentId,
      studentName: typeof parsed.studentName === "string" ? parsed.studentName : "",
      answers: parsed.answers,
    };
  } catch {
    return null;
  }
}

/** Monta o link público da anamnese para um aluno. */
export function buildAnamneseUrl(origin: string, studentId: string, studentName: string): string {
  const params = new URLSearchParams({ s: studentId, n: studentName });
  return `${origin}/anamnese?${params.toString()}`;
}
