"use client";

import * as React from "react";
import { SearchIcon, SlidersHorizontalIcon } from "lucide-react";

import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { EmptyState } from "@/shared/components/empty-state";
import { useFoodSearch } from "@/modules/foods/hooks/use-food-search";
import { FoodCard } from "@/modules/foods/components/food-card";
import { FoodDetail } from "@/modules/foods/components/food-detail";
import { FoodFilters } from "@/modules/foods/components/food-filters";
import type { Food } from "@/modules/foods/types";

/**
 * Navegador do banco inteligente de alimentos (Documento 15):
 * busca + filtros combináveis + lista + perfil detalhado.
 */
export function FoodBrowser({ foods }: { foods: Food[] }) {
  const { criteria, setCriteria, results, categories, tags } = useFoodSearch(foods);
  const [selected, setSelected] = React.useState<Food | null>(null);
  const [showFilters, setShowFilters] = React.useState(true);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={criteria.query ?? ""}
            onChange={(e) => setCriteria({ ...criteria, query: e.target.value || undefined })}
            placeholder="Buscar alimento ou sinônimo (ex.: aipim, frango)..."
            className="pl-9"
            aria-label="Buscar alimento"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label="Alternar filtros"
          aria-pressed={showFilters}
          onClick={() => setShowFilters((s) => !s)}
        >
          <SlidersHorizontalIcon className="size-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        {showFilters ? (
          <aside className="md:w-56 md:shrink-0">
            <FoodFilters
              criteria={criteria}
              onChange={setCriteria}
              categories={categories}
              tags={tags}
            />
          </aside>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="mb-3 text-sm text-muted-foreground">
            {results.length} {results.length === 1 ? "alimento" : "alimentos"}
          </div>
          {results.length === 0 ? (
            <EmptyState
              icon={<SearchIcon />}
              title="Nenhum alimento encontrado"
              description="Ajuste a busca ou remova alguns filtros para ver mais resultados."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {results.map((food) => (
                <FoodCard
                  key={food.id}
                  food={food}
                  onSelect={(f) => {
                    setSelected(f);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <FoodDetail
        food={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
