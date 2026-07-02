import type { Metadata } from "next";

import { PageHeader } from "@/shared/components/page-header";
import { listFoods } from "@/modules/foods/services";
import { FoodBrowser } from "@/modules/foods/components/food-browser";

export const metadata: Metadata = { title: "Alimentos" };

/**
 * Banco Inteligente de Alimentos (Documento 15 — Food Intelligence Engine).
 * Cada alimento é conhecido além dos macros: saciedade, praticidade, custo,
 * momento de uso, classificação estratégica e alertas contextuais.
 */
export default async function FoodsPage() {
  const foods = await listFoods();

  return (
    <>
      <PageHeader
        title="Alimentos"
        description="Banco inteligente: além dos macros — saciedade, praticidade, custo e aplicações estratégicas."
      />
      <FoodBrowser foods={foods} />
    </>
  );
}
