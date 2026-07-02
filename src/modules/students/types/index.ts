/**
 * Tipos do domínio Students (Documento 10 — Domain Students).
 */

/** Objetivo principal do aluno (goal_type do banco). */
export type StudentGoal =
  | "weight_loss"
  | "hypertrophy"
  | "recomposition"
  | "maintenance"
  | "performance"
  | "health"
  | "event_preparation";

export type StudentSex = "male" | "female" | "other";

/** Perfil permanente do aluno. */
export interface Student {
  id: string;
  fullName: string;
  sex: StudentSex | null;
  birthDate: string | null;
  heightCm: number | null;
  mainGoal: StudentGoal | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Dados de entrada para criar/editar um aluno. */
export interface StudentInput {
  fullName: string;
  sex: StudentSex | null;
  birthDate: string | null;
  heightCm: number | null;
  mainGoal: StudentGoal | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
}
