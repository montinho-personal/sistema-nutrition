/**
 * Análise do recordatório alimentar (Documento 05 — leitura clínica do dia).
 *
 * Interpreta o texto livre do "dia alimentar" da anamnese casando-o com o Banco
 * de Alimentos e aplicando regras determinísticas (Documento 08 — se dá para ser
 * regra, é regra; a IA fica para o enriquecimento opcional, ver
 * `src/prompts/recordatorioInterpretation.ts`).
 *
 * Saída: o que foi reconhecido em cada refeição + observações acionáveis
 * (risco/oportunidade/recomendação), sempre com orientação (Documento 02).
 */

import { curatedFoods } from "@/modules/foods/data/curatedFoods";
import type { Food } from "@/modules/foods/types";
import type { AnswerMap } from "@/modules/diagnosis/types";

/** Fração calórica proteica a partir da qual o alimento "conta" como proteína. */
const PROTEIN_SHARE = 0.3;
/** Até esta densidade (kcal/100 g) o alimento é tratado como vegetal/fruta. */
const VEG_MAX_KCAL = 45;

export type RecordatorioObsKind = "risk" | "opportunity" | "recommendation";

export interface RecordatorioObservation {
  id: string;
  kind: RecordatorioObsKind;
  title: string;
  detail: string;
}

export interface MealReading {
  key: "breakfast" | "lunch" | "dinner" | "snacks";
  label: string;
  text: string;
  matchedFoods: string[];
  hasProtein: boolean;
  hasVeg: boolean;
}

export interface RecordatorioAnalysis {
  hasData: boolean;
  meals: MealReading[];
  observations: RecordatorioObservation[];
}

const MEALS: { key: MealReading["key"]; label: string }[] = [
  { key: "breakfast", label: "Café da manhã" },
  { key: "lunch", label: "Almoço" },
  { key: "dinner", label: "Jantar" },
  { key: "snacks", label: "Lanches" },
];

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Palavras-chave de um alimento: a 1ª palavra do nome + os sinônimos. */
function foodKeywords(food: Food): string[] {
  // 1º token do nome ("Ovo de galinha, ..." → "ovo"; "Frango, peito" → "frango").
  const primary = normalize((food.name.split(",")[0] ?? "").trim().split(/\s+/)[0] ?? "");
  const words = [primary, ...(food.synonyms ?? []).map(normalize)];
  return words.filter((w) => w.length >= 3);
}

// Pré-computa as palavras-chave uma vez (o Banco de Alimentos é estático).
const FOOD_KEYWORDS: { food: Food; keywords: string[] }[] = curatedFoods.map((food) => ({
  food,
  keywords: foodKeywords(food),
}));

function keywordInText(text: string, keyword: string): boolean {
  if (keyword.includes(" ")) return text.includes(keyword);
  // Palavra isolada: casa por limite de palavra (evita "uva" em "chuva") e
  // aceita plural comum (ovo→ovos, banana→bananas, arroz→arrozes).
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}(?:s|es)?\\b`).test(text);
}

/** Alimentos do Banco reconhecidos num trecho de texto livre. */
function matchFoods(text: string): Food[] {
  const t = normalize(text);
  if (!t) return [];
  return FOOD_KEYWORDS.filter((e) => e.keywords.some((k) => keywordInText(t, k))).map((e) => e.food);
}

/** Campos da anamnese que revelam o que o aluno já come. */
const HABITUAL_KEYS = [
  "breakfast",
  "lunch",
  "dinner",
  "snacks",
  "current_diet_detail",
  "meals_out_food",
  "favorite_foods",
];

/**
 * Ids dos alimentos que o aluno já come, reconhecidos nos relatos da anamnese —
 * base para o cardápio seguir os hábitos (máxima aderência, Documento 00).
 */
export function extractHabitualFoodIds(answers: AnswerMap): string[] {
  const ids = new Set<string>();
  for (const key of HABITUAL_KEYS) {
    const value = answers[key];
    if (typeof value === "string" && value.trim()) {
      for (const food of matchFoods(value)) ids.add(food.id);
    }
  }
  return Array.from(ids);
}

function role(food: Food): "protein" | "veg" | "other" {
  const kcal = food.nutrition.energyKcal ?? 0;
  if (kcal > 0 && kcal <= VEG_MAX_KCAL) return "veg";
  if (kcal > 0 && ((food.nutrition.proteinG ?? 0) * 4) / kcal >= PROTEIN_SHARE) return "protein";
  return "other";
}

/** Indícios textuais de que o café foi pulado. */
function looksSkipped(text: string): boolean {
  const t = normalize(text);
  return /\b(pulo|nao tomo|nao como|nada|jejum|so cafe|apenas cafe)\b/.test(t);
}

const SUGARY_DRINK_HINTS = /\b(refrigerante|refri|suco|acucar|acucarado|energetico)\b/;
const PROCESSED_HINTS =
  /\b(frito|fritura|salgadinho|salgado|bolacha recheada|biscoito recheado|nuggets|salsicha|miojo|lamen|fast|hamburguer|batata frita|nugget)\b/;
const VEG_FRUIT_HINTS =
  /\b(salada|legume|verdura|vegetal|fruta|alface|tomate|brocolis|couve|cenoura|abobrinha|espinafre|banana|maca|laranja|mamao)\b/;
// Negação simples ("sem salada", "sem legumes") não conta como vegetal.
const VEG_NEGATED = /\bsem\s+(salada|legume|verdura|vegetal|fruta)/;

/** Menção a vegetal/fruta no texto, ignorando negações do tipo "sem salada". */
function mentionsVeg(normalizedText: string): boolean {
  return VEG_FRUIT_HINTS.test(normalizedText) && !VEG_NEGATED.test(normalizedText);
}

/**
 * Analisa o recordatório: reconhece alimentos por refeição e deriva observações
 * clínicas determinísticas. `foods` é opcional (usa o Banco curado por padrão).
 */
export function analyzeRecordatorio(answers: AnswerMap): RecordatorioAnalysis {
  const meals: MealReading[] = MEALS.map(({ key, label }) => {
    const text = typeof answers[key] === "string" ? (answers[key] as string) : "";
    const matched = matchFoods(text);
    return {
      key,
      label,
      text,
      matchedFoods: Array.from(new Set(matched.map((f) => f.name))),
      hasProtein: matched.some((f) => role(f) === "protein"),
      hasVeg: matched.some((f) => role(f) === "veg") || mentionsVeg(normalize(text)),
    };
  });

  const hasData = meals.some((m) => m.text.trim().length > 0);
  const observations: RecordatorioObservation[] = [];

  const breakfast = meals.find((m) => m.key === "breakfast")!;
  if (breakfast.text.trim()) {
    if (looksSkipped(breakfast.text)) {
      observations.push({
        id: "breakfast_skipped",
        kind: "recommendation",
        title: "Café da manhã pulado ou muito leve",
        detail:
          "Pular o café tende a concentrar a fome à tarde/noite. Se for da rotina, tudo bem — mas garantir proteína cedo (ovo, iogurte) costuma estabilizar o apetite do dia.",
      });
    } else if (!breakfast.hasProtein) {
      observations.push({
        id: "breakfast_low_protein",
        kind: "recommendation",
        title: "Café da manhã sem proteína",
        detail:
          "O relato do café não traz uma fonte de proteína. Incluir ovo, iogurte ou queijo dá mais saciedade e reduz os beliscos da manhã.",
      });
    }
  }

  // Poucos vegetais/frutas no dia inteiro.
  const anyVeg = meals.some((m) => m.hasVeg);
  if (hasData && !anyVeg) {
    observations.push({
      id: "low_vegetables",
      kind: "opportunity",
      title: "Poucos vegetais e frutas no relato",
      detail:
        "Nenhuma refeição mencionou salada, legumes ou frutas. Adicionar volume vegetal aumenta a saciedade com poucas calorias — um dos ajustes de maior retorno.",
    });
  }

  // Calorias líquidas (bebidas ou menção textual).
  const beverages = Array.isArray(answers.beverages) ? (answers.beverages as string[]) : [];
  const mentionsSugary = meals.some((m) => SUGARY_DRINK_HINTS.test(normalize(m.text)));
  if (beverages.includes("refrigerante") || mentionsSugary) {
    observations.push({
      id: "liquid_calories",
      kind: "risk",
      title: "Calorias líquidas no dia",
      detail:
        "Refrigerante e sucos adoçados somam calorias sem saciar. Trocar por água, chá ou a fruta inteira costuma abrir espaço calórico com pouca perda percebida.",
    });
  }

  // Hidratação baixa.
  if (answers.water_intake === "menos_1l") {
    observations.push({
      id: "low_water",
      kind: "recommendation",
      title: "Hidratação baixa",
      detail:
        "Menos de 1 litro por dia. A baixa hidratação se confunde com fome; subir a água é um ajuste simples que ajuda no apetite desde a primeira semana.",
    });
  }

  // Ultraprocessados/frituras no relato.
  const processedMeal = meals.find((m) => PROCESSED_HINTS.test(normalize(m.text)));
  if (processedMeal) {
    observations.push({
      id: "processed_foods",
      kind: "recommendation",
      title: "Ultraprocessados/frituras no relato",
      detail: `Há itens muito processados (${processedMeal.label.toLowerCase()}). Não precisa proibir — trocar por versões caseiras na maior parte das vezes já muda o resultado.`,
    });
  }

  // Reforço positivo: boa base proteica nas refeições principais.
  const mainMeals = meals.filter((m) => m.key !== "snacks" && m.text.trim());
  if (mainMeals.length >= 2 && mainMeals.every((m) => m.hasProtein)) {
    observations.push({
      id: "good_protein_base",
      kind: "opportunity",
      title: "Boa base proteica nas refeições",
      detail:
        "As refeições principais já trazem proteína — uma vantagem: dá para ajustar o restante (carboidrato/gordura) sem mexer no que sacia.",
    });
  }

  return { hasData, meals, observations };
}
