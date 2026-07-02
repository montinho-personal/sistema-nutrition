/**
 * Repositório de alunos — persistência local-first (Documento 11: acesso a
 * dados isolado da UI). Hoje grava no navegador (localStorage), permitindo
 * uso imediato sem backend. A implementação Supabase entra atrás desta mesma
 * interface quando o projeto for conectado.
 */

import { readLocal, writeLocal } from "@/shared/lib/local-store";
import type { Student, StudentInput } from "@/modules/students/types";

const STORAGE_KEY = "students";

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `stu_${Math.abs(Date.now())}`;
}

function readAll(): Student[] {
  return readLocal<Student[]>(STORAGE_KEY, []);
}

/** Lista todos os alunos, do mais recente para o mais antigo. */
export function listStudents(): Student[] {
  return [...readAll()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Retorna um aluno pelo id, ou null. */
export function getStudent(id: string): Student | null {
  return readAll().find((s) => s.id === id) ?? null;
}

/** Cria um novo aluno e devolve o registro criado. */
export function createStudent(input: StudentInput): Student {
  const timestamp = nowIso();
  const student: Student = {
    id: newId(),
    ...input,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  writeLocal(STORAGE_KEY, [student, ...readAll()]);
  return student;
}

/** Atualiza um aluno existente; retorna o registro atualizado ou null. */
export function updateStudent(id: string, input: StudentInput): Student | null {
  const all = readAll();
  const index = all.findIndex((s) => s.id === id);
  if (index === -1) return null;
  const updated: Student = { ...all[index], ...input, updatedAt: nowIso() };
  // Novo array (nunca mutar o em cache — o useSyncExternalStore compara por
  // referência e não re-renderiza se mutar in-place).
  writeLocal(
    STORAGE_KEY,
    all.map((s, i) => (i === index ? updated : s)),
  );
  return updated;
}

/** Remove um aluno. */
export function deleteStudent(id: string): void {
  writeLocal(
    STORAGE_KEY,
    readAll().filter((s) => s.id !== id),
  );
}
