"use client";

import * as React from "react";

import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/components/ui/badge";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { GOAL_LABELS } from "@/modules/foods/constants";
import type { FoodFilterCriteria, FoodGoal } from "@/modules/foods/types";

interface FoodFiltersProps {
  criteria: FoodFilterCriteria;
  onChange: (criteria: FoodFilterCriteria) => void;
  categories: string[];
  tags: string[];
}

const GOALS = Object.keys(GOAL_LABELS) as FoodGoal[];

/** Painel de filtros combináveis do banco inteligente (Documento 15). */
export function FoodFilters({ criteria, onChange, categories, tags }: FoodFiltersProps) {
  function toggleTag(tag: string) {
    const current = criteria.tags ?? [];
    const next = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag];
    onChange({ ...criteria, tags: next.length ? next : undefined });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-goal">Objetivo</Label>
        <Select
          value={criteria.goal ?? "all"}
          onValueChange={(v) =>
            onChange({ ...criteria, goal: v === "all" ? undefined : (v as FoodGoal) })
          }
        >
          <SelectTrigger id="filter-goal" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os objetivos</SelectItem>
            {GOALS.map((goal) => (
              <SelectItem key={goal} value={goal}>
                {GOAL_LABELS[goal]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-category">Categoria</Label>
        <Select
          value={criteria.categoryName ?? "all"}
          onValueChange={(v) =>
            onChange({ ...criteria, categoryName: v === "all" ? undefined : v })
          }
        >
          <SelectTrigger id="filter-category" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => {
            const active = criteria.tags?.includes(tag) ?? false;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                aria-pressed={active}
                className="rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <Badge
                  variant={active ? "default" : "outline"}
                  className={cn("cursor-pointer text-[11px]", !active && "hover:bg-accent")}
                >
                  {tag}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
