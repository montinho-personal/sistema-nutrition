import type { Metadata } from "next";

import { MealPlanView } from "@/modules/meal-plan/components/meal-plan-view";

export const metadata: Metadata = { title: "Plano Alimentar" };

/** Plano Alimentar de um aluno (Documento 00 — dieta como consequência). */
export default async function MealPlanStudentPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return <MealPlanView studentId={studentId} />;
}
