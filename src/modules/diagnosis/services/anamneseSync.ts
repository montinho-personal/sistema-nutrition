/**
 * Sincronização da anamnese via Supabase (quando configurado).
 *
 * Quando o Supabase está conectado, a anamnese preenchida no link público é
 * gravada direto no banco e o treinador a busca automaticamente — sem código
 * para copiar/colar. Sem Supabase, tudo degrada para o fluxo por código
 * (Documento 08 — o app funciona local-first).
 *
 * Usa funções SECURITY DEFINER no schema `public` (migração 0017), chamáveis
 * com a chave anon — não há acesso direto à tabela.
 */

import { isSupabaseConfigured } from "@/config/env";
import { createSupabaseBrowserClient } from "@/database/supabase/client";
import type { AnswerMap } from "@/modules/diagnosis/types";

export interface AnamneseSubmission {
  id: string;
  studentName: string;
  answers: AnswerMap;
}

/** Cliente com schema `public` (onde vivem as funções da anamnese). */
function publicClient() {
  return createSupabaseBrowserClient("public");
}

/** Habilitado quando o Supabase está configurado. */
export function isAnamneseSyncEnabled(): boolean {
  return isSupabaseConfigured;
}

/** Envia a anamnese do aluno para o banco. Retorna true em sucesso. */
export async function submitAnamnese(input: {
  studentId: string;
  studentName: string;
  answers: AnswerMap;
}): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await publicClient().rpc("montinho_submit_anamnese", {
      p_student_id: input.studentId,
      p_student_name: input.studentName,
      p_answers: input.answers,
    });
    return !error;
  } catch {
    return false;
  }
}

/** Busca a anamnese mais recente enviada para um aluno (ou null). */
export async function fetchLatestAnamnese(studentId: string): Promise<AnamneseSubmission | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await publicClient().rpc("montinho_fetch_anamnese", {
      p_student_id: studentId,
    });
    if (error || !Array.isArray(data) || data.length === 0) return null;
    // A função já ordena por created_at desc; preferir a não consumida.
    const row = data.find((r) => !r.consumed) ?? data[0];
    return {
      id: row.id as string,
      studentName: (row.student_name as string) ?? "",
      answers: (row.answers as AnswerMap) ?? {},
    };
  } catch {
    return null;
  }
}

/** Marca uma anamnese como já importada. */
export async function consumeAnamnese(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await publicClient().rpc("montinho_consume_anamnese", { p_id: id });
  } catch {
    // silencioso — marcar como consumida é best-effort.
  }
}
