import type { Metadata } from "next";

import { MealPlanIndex } from "@/modules/meal-plan/components/meal-plan-index";

export const metadata: Metadata = { title: "Plano Alimentar" };

/** Índice do Plano Alimentar (Documento 00 — escolher um aluno). */
export default function MealPlanPage() {
  return <MealPlanIndex />;
}
