"use client";

import * as React from "react";

import { filterFoods } from "@/modules/foods/services";
import type { Food, FoodFilterCriteria } from "@/modules/foods/types";

/**
 * Estado de busca/filtro do banco inteligente. Mantém os critérios e
 * devolve a lista filtrada memoizada (motores puros do FIE).
 */
export function useFoodSearch(foods: Food[]) {
  const [criteria, setCriteria] = React.useState<FoodFilterCriteria>({});

  const results = React.useMemo(() => filterFoods(foods, criteria), [foods, criteria]);

  const categories = React.useMemo(
    () =>
      Array.from(
        new Set(foods.map((f) => f.categoryName).filter((c): c is string => Boolean(c))),
      ).sort(),
    [foods],
  );

  const tags = React.useMemo(
    () => Array.from(new Set(foods.flatMap((f) => f.tags.map((t) => t.name)))).sort(),
    [foods],
  );

  return { criteria, setCriteria, results, categories, tags };
}
