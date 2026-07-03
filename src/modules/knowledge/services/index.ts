/**
 * Serviço da Base de Conhecimento — consulta pura (Documento 11).
 * Resolve entradas por id e por busca; monta referências enxutas para anexar
 * às decisões e hipóteses do sistema.
 */

import { knowledgeBase } from "@/modules/knowledge/data/knowledgeBase";
import type { KnowledgeEntry, KnowledgeReference } from "@/modules/knowledge/types";

const byId = new Map(knowledgeBase.map((e) => [e.id, e]));

/** Todas as entradas da base. */
export function listKnowledge(): KnowledgeEntry[] {
  return knowledgeBase;
}

/** Uma entrada pelo id (ou null). */
export function getKnowledge(id: string): KnowledgeEntry | null {
  return byId.get(id) ?? null;
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Busca por título, princípio, aplicação ou tags (tolerante a acentos). */
export function findKnowledge(query: string): KnowledgeEntry[] {
  const q = normalize(query).trim();
  if (!q) return knowledgeBase;
  return knowledgeBase.filter((e) => {
    const haystack = normalize(
      [e.title, e.principle, e.application, ...e.tags, ...e.sources.map((s) => s.label)].join(" "),
    );
    return q.split(/\s+/).every((token) => haystack.includes(token));
  });
}

/**
 * Referências enxutas (id, título, fonte principal) a partir de uma lista de
 * ids — para exibir "Fundamentos" numa decisão. Ids inexistentes são ignorados.
 */
export function referencesFor(ids: string[] | undefined): KnowledgeReference[] {
  if (!ids?.length) return [];
  const refs: KnowledgeReference[] = [];
  for (const id of ids) {
    const entry = byId.get(id);
    if (entry) {
      refs.push({ id: entry.id, title: entry.title, source: entry.sources[0]?.label ?? "" });
    }
  }
  return refs;
}
