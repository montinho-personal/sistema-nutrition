"use client";

import * as React from "react";
import { BookOpenIcon, SearchIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { EmptyState } from "@/shared/components/empty-state";
import { findKnowledge } from "@/modules/knowledge/services";
import { CATEGORY_LABELS, CATEGORY_ORDER, SOURCE_KIND_LABELS } from "@/modules/knowledge/constants";
import type { KnowledgeCategory, KnowledgeEntry } from "@/modules/knowledge/types";

function EntryCard({ entry }: { entry: KnowledgeEntry }) {
  return (
    <Card id={entry.id} className="scroll-mt-20">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{entry.title}</CardTitle>
          <Badge variant="secondary">{CATEGORY_LABELS[entry.category]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm">{entry.principle}</p>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Como o sistema aplica
          </span>
          <p className="text-sm text-muted-foreground">{entry.application}</p>
        </div>
        <div className="flex flex-col gap-1.5 border-t pt-3">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Fontes
          </span>
          <ul className="flex flex-col gap-1">
            {entry.sources.map((s) => (
              <li key={s.label} className="flex items-start gap-2 text-sm">
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  {SOURCE_KIND_LABELS[s.kind]}
                </Badge>
                <span className="text-muted-foreground">{s.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

/** Base de Conhecimento: princípios, aplicação e fontes — buscável e por categoria. */
export function KnowledgeBrowser() {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<KnowledgeCategory | "all">("all");

  const results = React.useMemo(() => {
    const found = findKnowledge(query);
    return category === "all" ? found : found.filter((e) => e.category === category);
  }, [query, category]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar princípio, tema ou fonte (ex.: saciedade, refeed, sono)..."
          className="pl-9"
          aria-label="Buscar na base de conhecimento"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <CategoryChip active={category === "all"} onClick={() => setCategory("all")}>
          Todas
        </CategoryChip>
        {CATEGORY_ORDER.map((c) => (
          <CategoryChip key={c} active={category === c} onClick={() => setCategory(c)}>
            {CATEGORY_LABELS[c]}
          </CategoryChip>
        ))}
      </div>

      <div className="mb-1 text-sm text-muted-foreground">
        {results.length} {results.length === 1 ? "fundamento" : "fundamentos"}
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={<BookOpenIcon />}
          title="Nada encontrado"
          description="Ajuste a busca ou troque a categoria para ver mais fundamentos."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {results.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-md border px-2.5 py-1 text-xs transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}
