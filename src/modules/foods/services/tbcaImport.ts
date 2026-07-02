/**
 * Importador tipado da TBCA/TACO (Documento 15 — "Importação preparada para TBCA").
 *
 * Esta camada mapeia um registro cru de uma fonte externa (linha de um
 * export CSV/JSON da TBCA ou TACO) para o formato de inserção do banco.
 * Não faz scraping: consome um arquivo já exportado, valida com Zod e
 * devolve linhas prontas para `insert into foods (...)`.
 *
 * A hierarquia de fontes (TBCA → TACO → internacional → estimativa) é
 * respeitada pela coluna `data_confidence` e pela prioridade de food_sources.
 */

import { rawFoodImportSchema, type RawFoodImport } from "@/modules/foods/validators";
import { logger } from "@/shared/services/logger";

/** Linha pronta para inserção em `public.foods`. */
export interface FoodInsertRow {
  source_name: string;
  source_code: string;
  name: string;
  food_group: string | null;
  energy_kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  sodium_mg: number | null;
  synonyms: string[];
  data_confidence: RawFoodImport["dataConfidence"];
}

/** Mapeia um registro cru validado para a linha de inserção. */
export function mapRawFoodToInsertRow(raw: RawFoodImport): FoodInsertRow {
  return {
    source_name: raw.sourceName,
    source_code: raw.sourceCode,
    name: raw.name.trim(),
    food_group: raw.foodGroup?.trim() ?? null,
    energy_kcal: raw.energyKcal,
    protein_g: raw.proteinG,
    carbs_g: raw.carbsG,
    fat_g: raw.fatG,
    fiber_g: raw.fiberG ?? null,
    sodium_mg: raw.sodiumMg ?? null,
    synonyms: raw.synonyms ?? [],
    data_confidence: raw.dataConfidence,
  };
}

/** Resultado de uma importação em lote. */
export interface ImportResult {
  rows: FoodInsertRow[];
  imported: number;
  skipped: number;
  errors: { index: number; reason: string }[];
}

/**
 * Valida e mapeia um lote de registros crus. Linhas inválidas são
 * puladas e reportadas — a importação nunca falha silenciosamente
 * (Documento 08 — nunca perder dados / sempre validar).
 */
export function importRawFoods(rawRows: unknown[]): ImportResult {
  const rows: FoodInsertRow[] = [];
  const errors: ImportResult["errors"] = [];

  rawRows.forEach((raw, index) => {
    const parsed = rawFoodImportSchema.safeParse(raw);
    if (!parsed.success) {
      errors.push({ index, reason: parsed.error.issues.map((i) => i.message).join("; ") });
      return;
    }
    rows.push(mapRawFoodToInsertRow(parsed.data));
  });

  if (errors.length > 0) {
    logger.warn("Importação de alimentos concluída com registros ignorados", {
      total: rawRows.length,
      imported: rows.length,
      skipped: errors.length,
    });
  }

  return { rows, imported: rows.length, skipped: errors.length, errors };
}
