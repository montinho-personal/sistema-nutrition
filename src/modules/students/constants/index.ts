import type { StudentGoal, StudentSex } from "@/modules/students/types";

/** Rótulos pt-BR dos objetivos do aluno. */
export const STUDENT_GOAL_LABELS: Record<StudentGoal, string> = {
  weight_loss: "Emagrecimento",
  hypertrophy: "Hipertrofia",
  recomposition: "Recomposição",
  maintenance: "Manutenção",
  performance: "Performance",
  health: "Saúde",
  event_preparation: "Preparação para evento",
};

/** Rótulos pt-BR do sexo. */
export const STUDENT_SEX_LABELS: Record<StudentSex, string> = {
  male: "Masculino",
  female: "Feminino",
  other: "Outro",
};
