-- =============================================================================
-- Migração 0014 — Food Intelligence Engine: extensão do schema (Sprint 1.3)
--
-- Documento 15: o alimento deixa de ser "calorias + macros" e passa a ser
-- conhecido em múltiplos perfis — nutricional completo, estratégico,
-- comportamental, logístico, restrições e confiança científica.
--
-- Extensão aditiva sobre o domínio Foods (migração 0004): nenhuma coluna
-- existente é removida; a arquitetura evolui sem reescrever (Documento 15).
-- =============================================================================

-- ── foods: identificação + nutrição completa + confiança científica ──────────
alter table montinho.foods
  add column if not exists food_group text,
  add column if not exists subgroup text,
  add column if not exists description text,
  add column if not exists synonyms text[],
  add column if not exists water_g numeric(6, 2) check (water_g is null or water_g >= 0),
  add column if not exists sugar_g numeric(6, 2) check (sugar_g is null or sugar_g >= 0),
  add column if not exists saturated_fat_g numeric(6, 2)
    check (saturated_fat_g is null or saturated_fat_g >= 0),
  add column if not exists mono_fat_g numeric(6, 2) check (mono_fat_g is null or mono_fat_g >= 0),
  add column if not exists poly_fat_g numeric(6, 2) check (poly_fat_g is null or poly_fat_g >= 0),
  add column if not exists sodium_mg numeric(8, 2) check (sodium_mg is null or sodium_mg >= 0),
  add column if not exists potassium_mg numeric(8, 2)
    check (potassium_mg is null or potassium_mg >= 0),
  add column if not exists processing_level text
    check (processing_level is null or processing_level in
      ('in_natura', 'minimally_processed', 'processed', 'ultra_processed')),
  add column if not exists data_confidence text not null default 'medium'
    check (data_confidence in ('high', 'medium', 'low', 'estimated')),
  add column if not exists data_reviewed_at date;

comment on column montinho.foods.food_group is 'Grupo alimentar (ex.: Cereais, Carnes, Frutas).';
comment on column montinho.foods.synonyms is 'Nomes alternativos para busca — ex.: {aipim, macaxeira}.';
comment on column montinho.foods.processing_level is
  'Nível de processamento (NOVA): in_natura → ultra_processed. Contexto, nunca demonização (Documento 15).';
comment on column montinho.foods.data_confidence is
  'Confiança dos dados (Documento 15 — Perfil Científico): high (TBCA/TACO) → estimated.';

-- Índice full-text incluindo sinônimos e descrição (busca por nome/sinônimo) ──
-- A resolução do regconfig por nome é STABLE; encapsular numa função IMMUTABLE
-- com o dicionário fixo torna a expressão indexável (padrão recomendado).
create or replace function montinho.food_search_vector(
  p_name text, p_synonyms text[], p_description text
)
returns tsvector
language sql
immutable
as $$
  select to_tsvector(
    'portuguese'::regconfig,
    coalesce(p_name, '') || ' ' ||
    coalesce(array_to_string(p_synonyms, ' '), '') || ' ' ||
    coalesce(p_description, '')
  );
$$;

comment on function montinho.food_search_vector(text, text[], text) is
  'Vetor de busca full-text (pt-BR) sobre nome + sinônimos + descrição de um alimento.';

drop index if exists montinho.idx_foods_name;
create index idx_foods_search on montinho.foods using gin (
  montinho.food_search_vector(name, synonyms, description)
);
create index if not exists idx_foods_group on montinho.foods (food_group);
create index if not exists idx_foods_processing on montinho.foods (processing_level);

-- ── food_attributes: perfis estratégico, comportamental e logístico ──────────
-- Amplia a escala de custo de 3 para 5 níveis (Documento 15 — Perfil Financeiro).
alter table montinho.food_attributes
  drop constraint if exists food_attributes_cost_range_check;
alter table montinho.food_attributes
  add constraint food_attributes_cost_range_check
  check (cost_range is null or cost_range in
    ('very_low', 'low', 'medium', 'high', 'very_high'));

alter table montinho.food_attributes
  -- Comportamental (Documento 15)
  add column if not exists palatability_score integer
    check (palatability_score is null or palatability_score between 0 and 100),
  add column if not exists overeating_risk text
    check (overeating_risk is null or overeating_risk in ('low', 'moderate', 'high')),
  add column if not exists good_for_hunger_control boolean,
  add column if not exists good_for_few_meals boolean,
  add column if not exists good_for_high_frequency boolean,
  -- Praticidade / logística (Documento 15)
  add column if not exists needs_cooking boolean,
  add column if not exists can_eat_cold boolean,
  add column if not exists can_prep_ahead boolean,
  add column if not exists needs_refrigeration boolean,
  add column if not exists spoils_quickly boolean,
  add column if not exists good_for_lunchbox boolean,
  add column if not exists good_for_travel boolean,
  add column if not exists good_for_work boolean,
  -- Popularidade (Documento 15)
  add column if not exists acceptance_score integer
    check (acceptance_score is null or acceptance_score between 0 and 100),
  add column if not exists availability text
    check (availability is null or availability in ('low', 'medium', 'high')),
  -- Classificação estratégica manual (override; o padrão é computado no serviço
  -- de forma determinística — Documento 08). Null = deixar o motor classificar.
  add column if not exists strategic_override text
    check (strategic_override is null or strategic_override in
      ('excellent', 'good', 'neutral', 'poor', 'context_dependent'));

comment on column montinho.food_attributes.overeating_risk is
  'Risco de exagero / gatilho de palatabilidade — usado pelo Motor de Risco, sem demonizar.';
comment on column montinho.food_attributes.strategic_override is
  'Sobrescreve a classificação estratégica computada. Null = motor decide (Documento 08).';

-- ── food_tags: tipo de tag (reutiliza a infra N:N para restrições) ───────────
-- Restrições dietéticas são modeladas como tags (tag_type = dietary),
-- reutilizando food_tag_assignments — nunca duplicar (Documento 11 / AEC 8).
alter table montinho.food_tags
  add column if not exists tag_type text not null default 'strategic'
    check (tag_type in ('strategic', 'nutritional', 'dietary', 'logistic', 'timing'));

comment on column montinho.food_tags.tag_type is
  'Classe da tag: strategic, nutritional, dietary (restrições), logistic, timing.';

create index if not exists idx_food_tags_type on montinho.food_tags (tag_type);

-- ── View enriquecida: leitura conveniente para busca e recomendação ──────────
-- A classificação estratégica NÃO é materializada aqui — é computada no serviço
-- (regra determinística, Documento 08). A view entrega os dados brutos + rótulos
-- qualitativos derivados diretamente dos scores.
create or replace view montinho.foods_enriched as
select
  f.id,
  f.name,
  f.food_group,
  f.subgroup,
  f.description,
  f.synonyms,
  f.category_id,
  fc.name as category_name,
  f.source_id,
  fs.name as source_name,
  fs.priority as source_priority,
  f.source_code,
  f.data_confidence,
  f.processing_level,
  f.energy_kcal,
  f.protein_g,
  f.carbs_g,
  f.fat_g,
  f.fiber_g,
  f.sugar_g,
  f.saturated_fat_g,
  f.sodium_mg,
  f.potassium_mg,
  -- Densidade energética (kcal/g) — derivada, base para o rótulo no serviço
  case when f.energy_kcal is not null then round(f.energy_kcal / 100.0, 2) end as energy_density,
  a.satiety_score,
  a.practicality_score,
  a.digestibility_score,
  a.palatability_score,
  a.acceptance_score,
  a.overeating_risk,
  a.cost_range,
  a.availability,
  a.prep_time_minutes,
  a.freezes_well,
  a.portability,
  a.needs_cooking,
  a.can_eat_cold,
  a.can_prep_ahead,
  a.needs_refrigeration,
  a.spoils_quickly,
  a.good_for_lunchbox,
  a.good_for_travel,
  a.good_for_work,
  a.good_for_hunger_control,
  a.good_for_few_meals,
  a.good_for_high_frequency,
  a.best_times,
  a.suitable_goals,
  a.strategic_applications,
  a.strategic_override,
  f.is_active
from montinho.foods f
  left join montinho.food_categories fc on fc.id = f.category_id
  left join montinho.food_sources fs on fs.id = f.source_id
  left join montinho.food_attributes a on a.food_id = f.id;

comment on view montinho.foods_enriched is
  'Alimento + atributos + categoria + fonte em uma linha (Documento 15). Classificação estratégica é computada no serviço FIE.';
