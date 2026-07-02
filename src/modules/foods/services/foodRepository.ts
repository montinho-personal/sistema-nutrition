/**
 * Acesso a dados do banco inteligente de alimentos.
 *
 * Quando o Supabase está configurado, lê da view `foods_enriched` e das
 * tabelas de tags/porções. Sem Supabase (desenvolvimento/demonstração),
 * usa o dataset curado em memória — a interface funciona sem backend,
 * coerente com o restante do app (Sprint 1.1).
 *
 * Toda a regra de negócio (classificação, alertas, filtros) vive nos
 * serviços puros; este repositório apenas busca dados (Documento 11).
 */

import { isSupabaseConfigured } from "@/config/env";
import { curatedFoods } from "@/modules/foods/data/curatedFoods";
import type { Food } from "@/modules/foods/types";

/**
 * Retorna todos os alimentos ativos do banco inteligente.
 * Nesta sprint a leitura via Supabase será conectada quando o fluxo
 * de dados do banco for construído; por ora usamos o dataset curado.
 */
export async function listFoods(): Promise<Food[]> {
  if (!isSupabaseConfigured) {
    return curatedFoods;
  }

  // A leitura via Supabase (view foods_enriched + tags + portions) será
  // implementada junto ao fluxo de dados do banco. O dataset curado
  // reflete o mesmo seed, garantindo paridade de comportamento.
  return curatedFoods;
}

/** Retorna um alimento pelo id (ou null). */
export async function getFoodById(id: string): Promise<Food | null> {
  const foods = await listFoods();
  return foods.find((food) => food.id === id) ?? null;
}
